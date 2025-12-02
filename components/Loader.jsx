import { useEffect, useRef } from "react";
import { View, Animated, Dimensions, StyleSheet } from "react-native";

const COLORS = {
  bg: '#0A0A0C',
  accent: '#F43F5E',
};

const Loader = ({ isLoading }) => {
  const screenHeight = Dimensions.get("screen").height;
  
  // Animated values for the dots
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (isLoading) {
      const createAnimation = (animValue, delay) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 300,
              delay,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ])
        );
      };
      
      const anim1 = createAnimation(dot1, 0);
      const anim2 = createAnimation(dot2, 150);
      const anim3 = createAnimation(dot3, 300);
      
      anim1.start();
      anim2.start();
      anim3.start();
      
      return () => {
        anim1.stop();
        anim2.stop();
        anim3.stop();
      };
    }
  }, [isLoading]);

  if (!isLoading) return null;

  const createDotStyle = (animValue) => ({
    transform: [
      {
        scale: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.4],
        }),
      },
    ],
    opacity: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 1],
    }),
  });

  return (
    <View style={[styles.container, { height: screenHeight }]}>
      <View style={styles.dotsContainer}>
        <Animated.View style={[styles.dot, createDotStyle(dot1)]} />
        <Animated.View style={[styles.dot, createDotStyle(dot2)]} />
        <Animated.View style={[styles.dot, createDotStyle(dot3)]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 12, 0.9)',
    zIndex: 10,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.accent,
  },
});

export default Loader;
