import { Animated } from 'react-native';
import { ANIMATION_DURATION } from '../constants';

/**
 * Create a spring animation with default settings
 */
export const createSpringAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  tension = 100,
  friction = 8,
): Animated.CompositeAnimation => {
  return Animated.spring(animatedValue, {
    toValue,
    useNativeDriver: true,
    tension,
    friction,
  });
};

/**
 * Create a timing animation with default settings
 */
export const createTimingAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  duration = ANIMATION_DURATION.MEDIUM,
  useNativeDriver = true,
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    useNativeDriver,
  });
};

/**
 * Create a fade in animation
 */
export const createFadeInAnimation = (
  animatedValue: Animated.Value,
  duration = ANIMATION_DURATION.MEDIUM,
): Animated.CompositeAnimation => {
  return createTimingAnimation(animatedValue, 1, duration);
};

/**
 * Create a fade out animation
 */
export const createFadeOutAnimation = (
  animatedValue: Animated.Value,
  duration = ANIMATION_DURATION.MEDIUM,
): Animated.CompositeAnimation => {
  return createTimingAnimation(animatedValue, 0, duration);
};

/**
 * Create a scale animation
 */
export const createScaleAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  duration = ANIMATION_DURATION.SHORT,
): Animated.CompositeAnimation => {
  return createTimingAnimation(animatedValue, toValue, duration);
};

/**
 * Create a slide animation
 */
export const createSlideAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  duration = ANIMATION_DURATION.MEDIUM,
): Animated.CompositeAnimation => {
  return createTimingAnimation(animatedValue, toValue, duration);
};

/**
 * Create a pulse animation (scale up and down)
 */
export const createPulseAnimation = (
  animatedValue: Animated.Value,
  minScale = 0.95,
  maxScale = 1.05,
  duration = ANIMATION_DURATION.LONG,
): Animated.CompositeAnimation => {
  return Animated.loop(
    Animated.sequence([
      createScaleAnimation(animatedValue, maxScale, duration / 2),
      createScaleAnimation(animatedValue, minScale, duration / 2),
    ]),
  );
};

/**
 * Create a bounce animation
 */
export const createBounceAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
): Animated.CompositeAnimation => {
  return Animated.spring(animatedValue, {
    toValue,
    useNativeDriver: true,
    tension: 300,
    friction: 4,
  });
};

/**
 * Create a stagger animation for multiple elements
 */
export const createStaggerAnimation = (
  animations: Animated.CompositeAnimation[],
  staggerDelay = 100,
): Animated.CompositeAnimation => {
  return Animated.stagger(staggerDelay, animations);
};

/**
 * Create a card flip animation
 */
export const createCardFlipAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  duration = ANIMATION_DURATION.SHORT,
): Animated.CompositeAnimation => {
  return createTimingAnimation(animatedValue, toValue, duration);
};

/**
 * Reset animated value to initial state
 */
export const resetAnimation = (animatedValue: Animated.Value, initialValue = 0): void => {
  animatedValue.setValue(initialValue);
};

/**
 * Create a sequence of animations
 */
export const createSequenceAnimation = (
  animations: Animated.CompositeAnimation[],
): Animated.CompositeAnimation => {
  return Animated.sequence(animations);
};

/**
 * Create a parallel animation
 */
export const createParallelAnimation = (
  animations: Animated.CompositeAnimation[],
): Animated.CompositeAnimation => {
  return Animated.parallel(animations);
};