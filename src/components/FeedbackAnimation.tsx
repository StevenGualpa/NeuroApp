// src/components/FeedbackAnimation.tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

interface FeedbackAnimationProps {
  type: 'success' | 'error' | 'winner' | 'loser';
  onFinish?: () => void;
}

const animationSources = {
  success: require('../assets/animations/success.json'),
  error: require('../assets/animations/error1.json'),
  winner: require('../assets/animations/winner.json'),
  loser: require('../assets/animations/loser1.json'),
};

const FeedbackAnimation: React.FC<FeedbackAnimationProps> = ({ type, onFinish }) => {
  return (
    <LottieView
      source={animationSources[type]}
      autoPlay
      loop={false}
      onAnimationFinish={onFinish}
      style={styles.animation}
    />
  );
};

const styles = StyleSheet.create({
  animation: {
    position: 'absolute',
    width: 200,
    height: 200,
    top: '30%',
    alignSelf: 'center',
    zIndex: 100,
  },
});

export default FeedbackAnimation;
