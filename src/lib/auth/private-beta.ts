import "server-only";
import type { PrismaClient, User } from "../../generated/prisma/client";
import {
  ADMIN_PASSWORD_RESET_TTL_MINUTES,
  PRIVATE_BETA_INVITE_TTL_MINUTES,
} from "./config";
import { randomToken, sha256Hex } from "./crypto";
import { hashPassword } from "./password";
import { normalizeEmail } from "./validation";

export type PrivateBetaErrorCode =
  | "admin_required"
  | "bootstrap_not_empty"
  | "email_mismatch"
  | "existing_user"
  | "expired"
  | "invalid"
  | "target_unavailable"
  | "used";

export class PrivateBetaAccessError extends Error {
  constructor(readonly code: PrivateBetaErrorCode) {
    super(code);
    this.name = "PrivateBetaAccessError";
  }
}

export interface IssuedPrivateLink {
  token: string;
  expiresAt: Date;
}

async function requireActiveAdmin(prisma: PrismaClient, email: string): Promise<User> {
  const admin = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
  if (!admin || admin.status !== "ACTIVE" || admin.role !== "ADMIN") {
    throw new PrivateBetaAccessError("admin_required");
  }
  return admin;
}

export async function bootstrapPrivateBetaAdmin(
  prisma: PrismaClient,
  input: { email: string; name: string },
): Promise<IssuedPrivateLink & { userId: string }> {
  const email = normalizeEmail(input.email);
  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + ADMIN_PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
  const passwordHash = await hashPassword(randomToken(48));
  const now = new Date();

  const user = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('doleth-private-beta-bootstrap'))`;
    if ((await tx.user.count()) !== 0) throw new PrivateBetaAccessError("bootstrap_not_empty");

    const created = await tx.user.create({
      data: {
        name: input.name.trim(),
        email,
        passwordHash,
        passwordChangedAt: now,
        status: "ACTIVE",
        role: "ADMIN",
        privateBetaActivatedAt: now,
      },
    });
    await tx.authToken.create({
      data: {
        userId: created.id,
        purpose: "ADMIN_PASSWORD_RESET",
        tokenHash,
        expiresAt,
      },
    });
    await tx.authEvent.create({
      data: {
        userId: created.id,
        type: "PRIVATE_BETA_ADMIN_BOOTSTRAPPED",
        context: "bootstrap_base_vacia",
      },
    });
    return created;
  });

  return { token, expiresAt, userId: user.id };
}

export async function createPrivateBetaInvitation(
  prisma: PrismaClient,
  input: { actorEmail: string; invitedEmail: string; ttlMinutes?: number },
): Promise<IssuedPrivateLink & { invitationId: string }> {
  const actor = await requireActiveAdmin(prisma, input.actorEmail);
  const invitedEmail = normalizeEmail(input.invitedEmail);
  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const ttlMinutes = input.ttlMinutes ?? PRIVATE_BETA_INVITE_TTL_MINUTES;
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  const now = new Date();

  const invitation = await prisma.$transaction(async (tx) => {
    const currentActor = await tx.user.findUnique({ where: { id: actor.id } });
    if (!currentActor || currentActor.status !== "ACTIVE" || currentActor.role !== "ADMIN") {
      throw new PrivateBetaAccessError("admin_required");
    }
    if (await tx.user.findUnique({ where: { email: invitedEmail }, select: { id: true } })) {
      throw new PrivateBetaAccessError("existing_user");
    }

    await tx.privateBetaInvite.updateMany({
      where: { email: invitedEmail, consumedAt: null, revokedAt: null },
      data: { revokedAt: now },
    });
    const created = await tx.privateBetaInvite.create({
      data: {
        tokenHash,
        email: invitedEmail,
        createdById: actor.id,
        expiresAt,
      },
    });
    await tx.authEvent.create({
      data: {
        userId: actor.id,
        type: "PRIVATE_BETA_INVITATION_CREATED",
        context: `invite:${created.id}`,
      },
    });
    return created;
  });

  return { token, expiresAt, invitationId: invitation.id };
}

export async function consumePrivateBetaInvitation(
  prisma: PrismaClient,
  input: {
    token: string;
    email: string;
    name: string;
    passwordHash: string;
    acceptedTermsAt: Date;
  },
): Promise<{ user: User; invitationId: string }> {
  const tokenHash = await sha256Hex(input.token);
  const email = normalizeEmail(input.email);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const invitation = await tx.privateBetaInvite.findUnique({
      where: { tokenHash },
      include: { createdBy: true },
    });
    if (!invitation) throw new PrivateBetaAccessError("invalid");
    if (invitation.consumedAt) throw new PrivateBetaAccessError("used");
    if (invitation.revokedAt) throw new PrivateBetaAccessError("invalid");
    if (invitation.expiresAt.getTime() <= now.getTime()) throw new PrivateBetaAccessError("expired");
    if (invitation.email !== email) throw new PrivateBetaAccessError("email_mismatch");
    if (invitation.createdBy.status !== "ACTIVE" || invitation.createdBy.role !== "ADMIN") {
      throw new PrivateBetaAccessError("invalid");
    }
    if (await tx.user.findUnique({ where: { email }, select: { id: true } })) {
      throw new PrivateBetaAccessError("existing_user");
    }

    const claimed = await tx.privateBetaInvite.updateMany({
      where: {
        id: invitation.id,
        consumedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: { consumedAt: now },
    });
    if (claimed.count !== 1) throw new PrivateBetaAccessError("used");

    const user = await tx.user.create({
      data: {
        name: input.name.trim(),
        email,
        passwordHash: input.passwordHash,
        status: "ACTIVE",
        privateBetaActivatedAt: now,
        acceptedTermsAt: input.acceptedTermsAt,
      },
    });
    await tx.privateBetaInvite.update({
      where: { id: invitation.id },
      data: { consumedById: user.id },
    });
    await tx.authEvent.create({
      data: {
        userId: user.id,
        type: "PRIVATE_BETA_INVITATION_CONSUMED",
        context: `invite:${invitation.id}`,
      },
    });

    return { user, invitationId: invitation.id };
  });
}

export async function issueAdministrativeRecovery(
  prisma: PrismaClient,
  input: { actorEmail: string; targetEmail: string },
): Promise<IssuedPrivateLink & { targetUserId: string; revokedSessions: number }> {
  const actor = await requireActiveAdmin(prisma, input.actorEmail);
  const target = await prisma.user.findUnique({ where: { email: normalizeEmail(input.targetEmail) } });
  if (!target || target.status !== "ACTIVE") throw new PrivateBetaAccessError("target_unavailable");

  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + ADMIN_PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
  const now = new Date();

  const revokedSessions = await prisma.$transaction(async (tx) => {
    const [currentActor, currentTarget] = await Promise.all([
      tx.user.findUnique({ where: { id: actor.id } }),
      tx.user.findUnique({ where: { id: target.id } }),
    ]);
    if (!currentActor || currentActor.status !== "ACTIVE" || currentActor.role !== "ADMIN") {
      throw new PrivateBetaAccessError("admin_required");
    }
    if (!currentTarget || currentTarget.status !== "ACTIVE") {
      throw new PrivateBetaAccessError("target_unavailable");
    }
    await tx.authToken.updateMany({
      where: { userId: target.id, purpose: "ADMIN_PASSWORD_RESET", consumedAt: null },
      data: { consumedAt: now },
    });
    const revoked = await tx.session.updateMany({
      where: { userId: target.id, revokedAt: null },
      data: { revokedAt: now },
    });
    await tx.authToken.create({
      data: {
        userId: target.id,
        purpose: "ADMIN_PASSWORD_RESET",
        tokenHash,
        expiresAt,
      },
    });
    await tx.authEvent.createMany({
      data: [
        {
          userId: target.id,
          type: "ADMIN_PASSWORD_RESET_ISSUED",
          context: `emitido_por:${actor.id}`,
        },
        {
          userId: actor.id,
          type: "ADMIN_PASSWORD_RESET_ISSUED",
          context: `emitido_para:${target.id}`,
        },
        {
          userId: target.id,
          type: "SESSIONS_REVOKED",
          context: `recuperacion_administrativa:${revoked.count}`,
        },
      ],
    });
    return revoked.count;
  });

  return { token, expiresAt, targetUserId: target.id, revokedSessions };
}

export async function completeAdministrativeRecovery(
  prisma: PrismaClient,
  input: { token: string; passwordHash: string },
): Promise<{ userId: string; revokedSessions: number }> {
  const tokenHash = await sha256Hex(input.token);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const token = await tx.authToken.findUnique({ where: { tokenHash }, include: { user: true } });
    if (!token || token.purpose !== "ADMIN_PASSWORD_RESET") throw new PrivateBetaAccessError("invalid");
    if (token.consumedAt) throw new PrivateBetaAccessError("used");
    if (token.expiresAt.getTime() <= now.getTime()) throw new PrivateBetaAccessError("expired");
    if (token.user.status !== "ACTIVE") throw new PrivateBetaAccessError("target_unavailable");

    const claimed = await tx.authToken.updateMany({
      where: {
        id: token.id,
        consumedAt: null,
        expiresAt: { gt: now },
      },
      data: { consumedAt: now },
    });
    if (claimed.count !== 1) throw new PrivateBetaAccessError("used");

    await tx.user.update({
      where: { id: token.userId },
      data: { passwordHash: input.passwordHash, passwordChangedAt: now },
    });
    const revoked = await tx.session.updateMany({
      where: { userId: token.userId, revokedAt: null },
      data: { revokedAt: now },
    });
    await tx.authEvent.createMany({
      data: [
        {
          userId: token.userId,
          type: "PASSWORD_RESET_COMPLETED",
          context: "recuperacion_administrativa",
        },
        {
          userId: token.userId,
          type: "SESSIONS_REVOKED",
          context: `recuperacion_administrativa_final:${revoked.count}`,
        },
      ],
    });

    return { userId: token.userId, revokedSessions: revoked.count };
  });
}
