import { useCallback, useEffect, useRef, useState } from 'react';

type UseStepControllerOptions = {
	maxStep: number;
	intervalMs?: number;
	initialStep?: number;
};

function clampStep(value: number, maxStep: number): number {
	return Math.max(0, Math.min(value, Math.max(0, maxStep)));
}

export function useStepController({
	maxStep,
	intervalMs = 1000,
	initialStep = 0,
}: UseStepControllerOptions) {
	const normalizedMaxStep = Math.max(0, maxStep);
	const maxStepRef = useRef(normalizedMaxStep);
	const [currentStep, setCurrentStepState] = useState(() => clampStep(initialStep, normalizedMaxStep));
	const [isRunning, setIsRunning] = useState(false);

	useEffect(() => {
		maxStepRef.current = normalizedMaxStep;
	}, [normalizedMaxStep]);

	const setCurrentStep = useCallback(
		(nextStep: number | ((prev: number) => number)) => {
			setCurrentStepState((prev) => {
				const resolved = typeof nextStep === 'function' ? nextStep(prev) : nextStep;
				return clampStep(resolved, maxStepRef.current);
			});
		},
		[],
	);

	const play = useCallback(() => {
		if (maxStepRef.current <= 0) return;
		setIsRunning(true);
	}, []);

	const pause = useCallback(() => {
		setIsRunning(false);
	}, []);

	const stepForward = useCallback(() => {
		setCurrentStep((prev) => prev + 1);
	}, [setCurrentStep]);

	const stepBackward = useCallback(() => {
		setCurrentStep((prev) => prev - 1);
	}, [setCurrentStep]);

	const reset = useCallback(() => {
		setIsRunning(false);
		setCurrentStep(0);
	}, [setCurrentStep]);

	useEffect(() => {
		setCurrentStepState((prev) => clampStep(prev, normalizedMaxStep));
	}, [normalizedMaxStep]);

	useEffect(() => {
		if (!isRunning) return;
		if (currentStep >= normalizedMaxStep) {
			setIsRunning(false);
			return;
		}

		const intervalId = window.setInterval(() => {
			setCurrentStepState((prev) => {
				if (prev >= normalizedMaxStep) {
					return prev;
				}
				return prev + 1;
			});
		}, intervalMs);

		return () => {
			window.clearInterval(intervalId);
		};
	}, [currentStep, intervalMs, isRunning, normalizedMaxStep]);

	useEffect(() => {
		if (currentStep >= normalizedMaxStep && isRunning) {
			setIsRunning(false);
		}
	}, [currentStep, isRunning, normalizedMaxStep]);

	return {
		currentStep,
		isRunning,
		setCurrentStep,
		play,
		pause,
		stepForward,
		stepBackward,
		reset,
	};
}

