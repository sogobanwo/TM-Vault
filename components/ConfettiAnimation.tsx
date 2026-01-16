import { View, Animated, Dimensions } from "react-native"
import { useEffect, useRef } from "react"

interface Particle {
  id: number
  x: Animated.Value
  y: Animated.Value
  opacity: Animated.Value
  rotation: Animated.Value
}

export default function ConfettiAnimation() {
  const { width, height } = Dimensions.get("window")
  const particles = useRef<Particle[]>([])

  useEffect(() => {
    // Create 30 particles
    particles.current = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: new Animated.Value(width / 2),
      y: new Animated.Value(height / 2),
      opacity: new Animated.Value(1),
      rotation: new Animated.Value(0),
    }))

    // Animate each particle
    particles.current.forEach((particle, index) => {
      const delay = (index % 10) * 50
      const duration = 2000 + Math.random() * 1000

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(particle.y, {
            toValue: height + 100,
            duration,
            useNativeDriver: false,
          }),
          Animated.timing(particle.x, {
            toValue: width / 2 + (Math.random() - 0.5) * width,
            duration,
            useNativeDriver: false,
          }),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: duration - 300,
            useNativeDriver: false,
          }),
          Animated.timing(particle.rotation, {
            toValue: Math.random() * 360,
            duration,
            useNativeDriver: false,
          }),
        ]),
      ]).start()
    })
  }, [width, height])

  return (
    <View
      className="absolute inset-0 pointer-events-none"
      style={{
        width,
        height,
      }}
    >
      {particles.current.map((particle) => (
        <Animated.View
          key={particle.id}
          style={{
            position: "absolute",
            left: particle.x,
            top: particle.y,
            opacity: particle.opacity,
            transform: [{
              rotate: particle.rotation.interpolate({
                inputRange: [0, 360],
                outputRange: ["0deg", "360deg"],
              }),
            }],
          }}
        >
          <View className="w-2 h-2 bg-yellow-400 rounded-full" />
        </Animated.View>
      ))}
    </View>
  )
}
