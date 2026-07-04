"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { FinancialRow } from "../../design-system/composites/FinancialRow";
import { SystemRail } from "../../design-system/composites/SystemRail";
import { motionCurve, motionDuration } from "../../design-system/tokens";
import { Button } from "../../design-system/primitives/Button";
import { Divider } from "../../design-system/primitives/Divider";
import { Label } from "../../design-system/primitives/Label";
import { NumericValue } from "../../design-system/primitives/NumericValue";
import { SectionTitle } from "../../design-system/primitives/SectionTitle";
import { Surface } from "../../design-system/primitives/Surface";
import { TextLink } from "../../design-system/primitives/TextLink";
import { RecommendationEvidenceExperience } from "./evidence";
import type { ActDecisionState, ActViewModel } from "./model";
import styles from "./ActPage.module.css";

export interface ActPageProps {
  model: ActViewModel;
  initialDecisionState?: ActDecisionState;
}

export function ActPage({
  model,
  initialDecisionState = "idle",
}: ActPageProps) {
  const [decisionState, setDecisionState] = useState(initialDecisionState);
  const reduceMotion = useReducedMotion();
  const isConfirming = decisionState === "confirming";
  const isConfirmed = decisionState === "confirmed";
  const decisionOutcome =
    decisionState === "idle" || decisionState === "confirming" || decisionState === "confirmed"
      ? null
      : model.decision.outcomes[decisionState];
  const decisionTransition = {
    duration: reduceMotion ? motionDuration.micro : motionDuration.surface,
    ease: motionCurve.settle,
  };

  return (
    <main className={`app-canvas ${styles.canvas}`}>
      <div className={`app-canvas__content ${styles.content}`}>
        <header className={styles.navigation}>
          <TextLink className={styles.backLink} href={model.navigation.backHref} kind="standalone">
            {model.navigation.backLabel}
          </TextLink>
          <h1 className={styles.title}>{model.navigation.title}</h1>
          <span aria-hidden="true" className={styles.navigationReserve} />
        </header>

        <SystemRail className={styles.rail} {...model.rail} />

        <Surface
          border="default"
          className={styles.recommendation}
          elevation="soft"
          padding="lg"
          radius="xl"
          tone="raised"
        >
          <Label as="p" size="m" tone="secondary">
            {model.recommendation.stateLabel}
          </Label>
          <h2 className={styles.conclusion}>{model.recommendation.conclusion}</h2>
          <NumericValue {...model.recommendation.amount} />
          <p className={styles.consequence}>{model.recommendation.consequence}</p>
          <Divider className={styles.divider} />
          <RecommendationEvidenceExperience
            confidenceLabel={model.recommendation.confidenceLabel}
            evidence={model.evidence}
            triggerLabel={model.recommendation.evidenceTriggerLabel}
          />
        </Surface>

        <p className={styles.reason}>{model.reason}</p>

        {isConfirming || isConfirmed ? null : (
          <Surface
            border="subtle"
            className={styles.impact}
            padding="sm"
            radius="lg"
            tone="base"
          >
            <SectionTitle title={model.impact.title} />
            <div className={styles.impactRows}>
              {model.impact.rows.map((row, index) => (
                <div className={styles.impactUnit} key={row.label}>
                  {index > 0 ? <Divider /> : null}
                  <FinancialRow {...row} className={styles.impactRow!} />
                </div>
              ))}
            </div>
          </Surface>
        )}

        <div className={styles.decision} id="act-decision">
          <div className={styles.decisionHeader}>
            <Label as="p" size="m" tone="secondary">
              {model.decision.label}
            </Label>
            {decisionState === "idle" ? (
              <p className={styles.decisionHelper}>{model.decision.helper}</p>
            ) : null}
          </div>

          <AnimatePresence initial={false} mode="wait">
            {isConfirming ? (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className={styles.decisionState}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
                key="confirming"
                transition={decisionTransition}
              >
                <Surface
                  border="subtle"
                  className={styles.confirmation}
                  padding="md"
                  radius="lg"
                  tone="base"
                >
                  <div className={styles.confirmationHeader}>
                    <Label as="p" size="m" tone="primary">
                      {model.decision.confirmation.label}
                    </Label>
                    <p className={styles.confirmationHelper}>
                      {model.decision.confirmation.helper}
                    </p>
                  </div>

                  <Divider />

                  <div className={styles.confirmationAmount}>
                    <Label as="p" size="s" tone="secondary">
                      {model.decision.confirmation.amountLabel}
                    </Label>
                    <NumericValue {...model.decision.confirmation.amount} />
                  </div>

                  <Divider />

                  <div className={styles.confirmationDetails}>
                    {model.decision.confirmation.details.map((detail, index) => (
                      <div className={styles.confirmationDetail} key={detail.label}>
                        {index > 0 ? <Divider /> : null}
                        <div className={styles.confirmationDetailContent}>
                          <Label as="p" size="s" tone="secondary">
                            {detail.label}
                          </Label>
                          <p className={styles.confirmationValue}>{detail.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.confirmationActions}>
                    <Button
                      kind="primary"
                      onClick={() => setDecisionState("confirmed")}
                      size="lg"
                      width="fill"
                    >
                      {model.decision.confirmation.primaryActionLabel}
                    </Button>
                    <TextLink
                      href="#act-decision"
                      kind="standalone"
                      onClick={(event) => {
                        event.preventDefault();
                        setDecisionState("idle");
                      }}
                    >
                      {model.decision.confirmation.secondaryActionLabel}
                    </TextLink>
                  </div>
                </Surface>
              </motion.div>
            ) : isConfirmed ? (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className={styles.decisionState}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
                key="confirmed"
                transition={decisionTransition}
              >
                <Surface
                  border="subtle"
                  className={styles.decisionCompletion}
                  padding="md"
                  radius="lg"
                  tone="base"
                >
                  <div className={styles.decisionCompletionCopy}>
                    <Label as="p" size="m" tone="primary">
                      {model.decision.completion.label}
                    </Label>
                    <p className={styles.decisionCompletionTitle}>
                      {model.decision.completion.title}
                    </p>
                    <p className={styles.decisionCompletionDetail}>
                      {model.decision.completion.detail}
                    </p>
                    <p className={styles.decisionCompletionControl}>
                      {model.decision.completion.control}
                    </p>
                  </div>
                  <div className={styles.decisionCompletionActions}>
                    <Button
                      kind="secondary"
                      onClick={() => setDecisionState("confirming")}
                      size="lg"
                      width="fill"
                    >
                      {model.decision.completion.undoLabel}
                    </Button>
                    <TextLink
                      href="#act-decision"
                      kind="standalone"
                      onClick={(event) => {
                        event.preventDefault();
                        setDecisionState("idle");
                      }}
                    >
                      {model.decision.completion.closeLabel}
                    </TextLink>
                  </div>
                </Surface>
              </motion.div>
            ) : decisionOutcome ? (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className={styles.decisionState}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
                key={decisionState}
                transition={decisionTransition}
              >
                <Surface
                  border="subtle"
                  className={styles.decisionResult}
                  padding="md"
                  radius="lg"
                  tone="base"
                >
                  <div className={styles.decisionResultCopy}>
                    <Label as="p" size="m" tone="primary">
                      {decisionOutcome.label}
                    </Label>
                    <p className={styles.decisionResultTitle}>{decisionOutcome.title}</p>
                    <p className={styles.decisionResultDetail}>{decisionOutcome.detail}</p>
                  </div>
                  <TextLink
                    href="#act-decision"
                    kind="standalone"
                    onClick={(event) => {
                      event.preventDefault();
                      setDecisionState("idle");
                    }}
                  >
                    {decisionOutcome.resetLabel}
                  </TextLink>
                </Surface>
              </motion.div>
            ) : (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className={styles.decisionActions}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
                key="idle"
                transition={decisionTransition}
              >
                <Button
                  kind="primary"
                  onClick={() => setDecisionState("confirming")}
                  size="lg"
                  width="fill"
                >
                  {model.decision.primaryActionLabel}
                </Button>
                <div className={styles.secondaryActions}>
                  {model.decision.secondaryActions.map((action) => (
                    <TextLink
                      href="#act-decision"
                      key={action.id}
                      kind="standalone"
                      onClick={(event) => {
                        event.preventDefault();
                        setDecisionState(action.id);
                      }}
                    >
                      {action.label}
                    </TextLink>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
