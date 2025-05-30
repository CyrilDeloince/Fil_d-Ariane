import type { AccelerometerMeasurement } from "expo-sensors";
import { Accelerometer, Magnetometer } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import { Button, Dimensions, StyleSheet, Text, View } from "react-native";

const STEP_THRESHOLD = 1.2;
const STEP_LENGTH = 0.7; // meters

type SensorSubscription = {
  remove: () => void;
} | null;

export default function App() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [path, setPath] = useState([{ x: 0, y: 0 }]);
  const [magneto, setMagneto] = useState({ x: 0, y: 0, z: 0 });
  const [lastAccel, setLastAccel] = useState<AccelerometerMeasurement | null>(
    null
  );
  const [tracking, setTracking] = useState(false);

  const accelSub = useRef<SensorSubscription>(null);
  const magnetoSub = useRef<SensorSubscription>(null);

  useEffect(() => {
    if (tracking) {
      accelSub.current = Accelerometer.addListener((data) => {
        if (lastAccel) {
          const delta =
            Math.abs(data.x - lastAccel.x) +
            Math.abs(data.y - lastAccel.y) +
            Math.abs(data.z - lastAccel.z);
          if (delta > STEP_THRESHOLD) {
            const angle = Math.atan2(magneto.y, magneto.x);
            const dx = STEP_LENGTH * Math.cos(angle);
            const dy = STEP_LENGTH * Math.sin(angle);
            const newX = position.x + dx;
            const newY = position.y + dy;
            const newPos = { x: newX, y: newY };
            setPosition(newPos);
            setPath((p) => [...p, newPos]);
          }
        }
        setLastAccel(data);
      });
      magnetoSub.current = Magnetometer.addListener(setMagneto);
    }
    return () => {
      accelSub.current?.remove();
      magnetoSub.current?.remove();
      accelSub.current = null;
      magnetoSub.current = null;
    };
  }, [tracking, lastAccel, magneto, position]);

  const handleReset = () => {
    setTracking(false);
    setPosition({ x: 0, y: 0 });
    setPath([{ x: 0, y: 0 }]);
    setLastAccel(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <Button
          title={tracking ? "Stop" : "Start"}
          onPress={() => setTracking(!tracking)}
        />
        <Button title="Reset" onPress={handleReset} />
      </View>
      <View style={styles.canvas}>
        {path.map((p, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor:
                i === 0 ? "green" : i === path.length - 1 ? "red" : "blue",
              left: Dimensions.get("window").width / 2 + p.x * 20,
              top: Dimensions.get("window").height / 2 - p.y * 20,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={styles.stepText}>{i}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  canvas: {
    flex: 1,
    width: "100%",
    position: "relative",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  stepText: {
    fontSize: 8,
    color: "white",
    textAlign: "center",
  },
});
