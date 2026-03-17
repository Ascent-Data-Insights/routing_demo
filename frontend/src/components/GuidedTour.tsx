import { useState, useEffect, useRef } from 'react'
import Joyride, { STATUS, EVENTS, type CallBackProps, type TooltipRenderProps } from 'react-joyride'
import { desktopSteps, mobileSteps, desktopResultsSteps, mobileResultsSteps, type TourStep } from '../tour/tourSteps'

interface GuidedTourProps {
  run: boolean
  onComplete: () => void
  onStepChange?: (step: number) => void
  isMobile: boolean
  resultsTourRun: boolean
  onResultsTourComplete: () => void
  onResultsStepChange?: (step: number) => void
}

function TourTooltip({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
  size,
}: TooltipRenderProps) {
  return (
    <div
      {...tooltipProps}
      style={{ borderRadius: 8, background: 'white', maxWidth: 360, boxShadow: '0 4px 24px rgba(3,52,78,0.18)' }}
      className="p-5 font-body"
    >
      {step.title && (
        <div className="mb-2 font-heading font-semibold text-base text-[#03344E]">
          {step.title as React.ReactNode}
        </div>
      )}
      <div className="text-sm text-zinc-700 leading-relaxed mb-4">
        {step.content as React.ReactNode}
      </div>
      <div className="flex items-center justify-between gap-2">
        <button
          {...skipProps}
          className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors px-1 py-1"
        >
          Skip tour
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 tabular-nums">
            {index + 1} / {size}
          </span>
          {index > 0 && (
            <button
              {...backProps}
              className="px-3 py-1.5 rounded-md text-xs font-semibold border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Back
            </button>
          )}
          <button
            {...(continuous ? primaryProps : closeProps)}
            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-[#03344E] text-white hover:bg-[#03344E]/90 transition-colors"
          >
            {isLastStep ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function GuidedTour({
  run,
  onComplete,
  onStepChange,
  isMobile,
  resultsTourRun,
  onResultsTourComplete,
  onResultsStepChange,
}: GuidedTourProps) {
  const steps: TourStep[] = isMobile ? mobileSteps : desktopSteps
  const resultsSteps: TourStep[] = isMobile ? mobileResultsSteps : desktopResultsSteps

  // Controlled step index for main tour
  const [stepIndex, setStepIndex] = useState(0)

  // Controlled step index for results tour
  const [resultsStepIndex, setResultsStepIndex] = useState(0)

  // Ref to track pending mobile step-transition timer for main tour
  const pendingStepTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Ref to track pending mobile step-transition timer for results tour
  const pendingResultsStepTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset main step index when the tour starts or when isMobile changes
  useEffect(() => {
    if (run) setStepIndex(0)
  }, [run, isMobile])

  // Clear any pending main timer when the tour stops
  useEffect(() => {
    if (!run && pendingStepTimer.current) {
      clearTimeout(pendingStepTimer.current)
      pendingStepTimer.current = null
    }
  }, [run])

  // Reset results step index when results tour starts
  useEffect(() => {
    if (resultsTourRun) setResultsStepIndex(0)
  }, [resultsTourRun, isMobile])

  // Clear any pending results timer when the results tour stops
  useEffect(() => {
    if (!resultsTourRun && pendingResultsStepTimer.current) {
      clearTimeout(pendingResultsStepTimer.current)
      pendingResultsStepTimer.current = null
    }
  }, [resultsTourRun])

  function handleCallback(data: CallBackProps) {
    const { status, type, index, action } = data

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      onComplete()
      setStepIndex(0)
      return
    }

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      const nextIndex = index + (action === 'prev' ? -1 : 1)

      if (nextIndex < 0) return
      if (nextIndex >= steps.length) {
        onComplete()
        setStepIndex(0)
        return
      }

      if (isMobile) {
        const nextStep = steps[nextIndex] as TourStep | undefined
        const requiredTab = nextStep?.data?.requiredTab

        if (requiredTab) {
          onStepChange?.(nextIndex)
          if (pendingStepTimer.current) clearTimeout(pendingStepTimer.current)
          pendingStepTimer.current = setTimeout(() => {
            setStepIndex(nextIndex)
          }, 300)
        } else {
          onStepChange?.(nextIndex)
          setStepIndex(nextIndex)
        }
      } else {
        onStepChange?.(nextIndex)
        setStepIndex(nextIndex)
      }
    }
  }

  function handleResultsCallback(data: CallBackProps) {
    const { status, type, index, action } = data

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      onResultsTourComplete()
      setResultsStepIndex(0)
      return
    }

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      const nextIndex = index + (action === 'prev' ? -1 : 1)

      if (nextIndex < 0) return
      if (nextIndex >= resultsSteps.length) {
        onResultsTourComplete()
        setResultsStepIndex(0)
        return
      }

      if (isMobile) {
        const nextStep = resultsSteps[nextIndex] as TourStep | undefined
        const requiredTab = nextStep?.data?.requiredTab

        if (requiredTab) {
          onResultsStepChange?.(nextIndex)
          if (pendingResultsStepTimer.current) clearTimeout(pendingResultsStepTimer.current)
          pendingResultsStepTimer.current = setTimeout(() => {
            setResultsStepIndex(nextIndex)
          }, 300)
        } else {
          onResultsStepChange?.(nextIndex)
          setResultsStepIndex(nextIndex)
        }
      } else {
        onResultsStepChange?.(nextIndex)
        setResultsStepIndex(nextIndex)
      }
    }
  }

  return (
    <>
      <Joyride
        steps={steps}
        run={run}
        stepIndex={stepIndex}
        continuous={true}
        showSkipButton={true}
        showProgress={false}
        scrollToFirstStep={true}
        disableOverlayClose={false}
        tooltipComponent={TourTooltip}
        floaterProps={{ disableAnimation: true }}
        styles={{
          options: {
            overlayColor: 'rgba(3, 52, 78, 0.75)',
            zIndex: 10000,
          },
        }}
        callback={handleCallback}
      />
      <Joyride
        steps={resultsSteps}
        run={resultsTourRun}
        stepIndex={resultsStepIndex}
        continuous={true}
        showSkipButton={true}
        showProgress={false}
        scrollToFirstStep={true}
        disableOverlayClose={false}
        tooltipComponent={TourTooltip}
        floaterProps={{ disableAnimation: true }}
        styles={{
          options: {
            overlayColor: 'rgba(3, 52, 78, 0.75)',
            zIndex: 10000,
          },
        }}
        callback={handleResultsCallback}
      />
    </>
  )
}
