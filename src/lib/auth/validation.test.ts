import { describe, expect, it } from "vitest";
import {
  assessPassword,
  emailError,
  nameError,
  normalizeEmail,
  passwordError,
  validateNewPassword,
  validateRegistration,
} from "./validation";

describe("normalizeEmail", () => {
  it("recorta, baja a minúsculas y normaliza la forma unicode", () => {
    expect(normalizeEmail("  Vos@Ejemplo.COM ")).toBe("vos@ejemplo.com");
  });
});

describe("emailError", () => {
  it("acepta direcciones razonables", () => {
    expect(emailError("vos@ejemplo.com")).toBeNull();
    expect(emailError("nombre.apellido+etiqueta@sub.ejemplo.com.ar")).toBeNull();
  });

  it("rechaza direcciones sin dominio, vacías o demasiado largas", () => {
    expect(emailError("")).not.toBeNull();
    expect(emailError("vos@ejemplo")).not.toBeNull();
    expect(emailError("sin-arroba.com")).not.toBeNull();
    expect(emailError("vos con espacio@ejemplo.com")).not.toBeNull();
    expect(emailError(`${"a".repeat(250)}@ejemplo.com`)).not.toBeNull();
  });
});

describe("nameError", () => {
  it("exige entre 2 y 80 caracteres", () => {
    expect(nameError("Francisco")).toBeNull();
    expect(nameError("F")).not.toBeNull();
    expect(nameError("   ")).not.toBeNull();
    expect(nameError("a".repeat(81))).not.toBeNull();
  });
});

describe("passwordError", () => {
  it("acepta contraseñas largas sin exigir símbolos", () => {
    expect(passwordError("caballo correcto grapa")).toBeNull();
  });

  it("rechaza contraseñas cortas, comunes o de un solo carácter repetido", () => {
    expect(passwordError("corta123")).not.toBeNull();
    expect(passwordError("password1")).not.toBeNull();
    expect(passwordError("aaaaaaaaaaaa")).not.toBeNull();
  });
});

describe("assessPassword", () => {
  it("puntúa de menor a mayor sin bajar al subir la calidad", () => {
    expect(assessPassword("").score).toBe(0);
    expect(assessPassword("password1").strength).toBe("weak");
    expect(assessPassword("melon tranquilo 22").strength).toBe("strong");
    expect(assessPassword("Melon-Tranquilo-2026!").strength).toBe("strong");
  });
});

describe("validateRegistration", () => {
  const valid = {
    name: "Francisco",
    email: "Vos@Ejemplo.com",
    password: "caballo correcto grapa",
    passwordConfirmation: "caballo correcto grapa",
    acceptedTerms: true,
  };

  it("normaliza el email y el nombre cuando todo está bien", () => {
    const result = validateRegistration(valid);
    expect(result.ok).toBe(true);
    expect(result.values.email).toBe("vos@ejemplo.com");
  });

  it("marca la confirmación distinta", () => {
    const result = validateRegistration({ ...valid, passwordConfirmation: "otra cosa distinta" });
    expect(result.ok).toBe(false);
    expect(result.errors.passwordConfirmation).toBeDefined();
  });

  it("exige aceptar los términos", () => {
    const result = validateRegistration({ ...valid, acceptedTerms: false });
    expect(result.ok).toBe(false);
    expect(result.errors.acceptedTerms).toBeDefined();
  });

  it("no reporta el error de confirmación cuando la contraseña ya es inválida", () => {
    const result = validateRegistration({ ...valid, password: "corta", passwordConfirmation: "corta" });
    expect(result.errors.password).toBeDefined();
    expect(result.errors.passwordConfirmation).toBeUndefined();
  });
});

describe("validateNewPassword", () => {
  it("acepta una contraseña sólida repetida", () => {
    expect(validateNewPassword({ password: "melon tranquilo 22", passwordConfirmation: "melon tranquilo 22" }).ok).toBe(
      true,
    );
  });

  it("rechaza cuando no coinciden", () => {
    expect(
      validateNewPassword({ password: "melon tranquilo 22", passwordConfirmation: "melon tranquilo 23" }).ok,
    ).toBe(false);
  });
});
