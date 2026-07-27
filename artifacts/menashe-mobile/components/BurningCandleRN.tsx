import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

interface LearnerInfo {
  id: string;
  learnerName: string;
  studySubject: string;
}

interface Props {
  deceasedName: string;
  yahrzeitNumber?: number;
  donorName?: string;
  learners?: LearnerInfo[];
  isLit?: boolean;
  compact?: boolean;
}

export default function BurningCandleRN({
  deceasedName,
  yahrzeitNumber,
  donorName,
  learners = [],
  isLit = true,
  compact = false,
}: Props) {
  const flicker = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const [activeLearnerIdx, setActiveLearnerIdx] = useState(0);
  const [showLearner, setShowLearner] = useState(false);
  const learnerOpacity = useRef(new Animated.Value(0)).current;
  const learnerY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLit) return;
    const flickerAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(flicker, { toValue: -0.5, duration: 400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0.8, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0, duration: 350, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    const glowAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    flickerAnim.start();
    glowAnim.start();
    return () => { flickerAnim.stop(); glowAnim.stop(); };
  }, [isLit]);

  useEffect(() => {
    if (learners.length === 0) return;
    let i = 0;
    const show = () => {
      setActiveLearnerIdx(i % learners.length);
      setShowLearner(true);
      learnerY.setValue(0);
      learnerOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(learnerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(learnerY, { toValue: -40, duration: 3800, easing: Easing.linear, useNativeDriver: true }),
      ]).start(() => {
        Animated.timing(learnerOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
          setShowLearner(false);
        });
      });
      i++;
    };
    show();
    const iv = setInterval(show, 5500);
    return () => clearInterval(iv);
  }, [learners.length]);

  const flickerRotate = flicker.interpolate({ inputRange: [-1, 1], outputRange: ["-5deg", "5deg"] });
  const flickerScale = flicker.interpolate({ inputRange: [-1, 1], outputRange: [0.88, 1.08] });
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.65] });

  const W = compact ? 100 : 130;
  const candleW = compact ? 38 : 46;
  const candleH = compact ? 64 : 80;
  const holderW = compact ? 46 : 56;
  const flameAreaH = compact ? 68 : 84;
  const outerFlameW = compact ? 28 : 36;
  const outerFlameH = compact ? 46 : 58;
  const midFlameW = compact ? 18 : 24;
  const midFlameH = compact ? 34 : 44;
  const innerFlameW = compact ? 11 : 14;
  const innerFlameH = compact ? 25 : 32;
  const activeLearner = learners[activeLearnerIdx];

  return (
    <View style={{ width: W, alignItems: "center" }}>
      {/* Flame area */}
      <View style={{ height: flameAreaH, width: 60, alignItems: "center", justifyContent: "flex-end" }}>
        {isLit ? (
          <>
            {/* Glow halo */}
            <Animated.View style={{
              position: "absolute", bottom: -4,
              width: compact ? 52 : 66, height: compact ? 66 : 82,
              borderRadius: 999,
              backgroundColor: "rgba(255,120,0,0.14)",
              opacity: glowOpacity,
            }} />

            {/* Outer flame */}
            <Animated.View style={{
              position: "absolute", bottom: 0,
              width: outerFlameW, height: outerFlameH,
              borderRadius: 999,
              backgroundColor: "rgba(255,80,0,0.88)",
              transform: [{ rotate: flickerRotate }, { scaleX: flickerScale }],
              transformOrigin: "bottom center",
              opacity: 0.9,
            }} />

            {/* Mid flame */}
            <Animated.View style={{
              position: "absolute", bottom: 0,
              width: midFlameW, height: midFlameH,
              borderRadius: 999,
              backgroundColor: "rgba(255,190,20,0.97)",
              transform: [{ rotate: flickerRotate }, { scaleX: flickerScale }],
            }} />

            {/* Inner flame */}
            <View style={{
              position: "absolute", bottom: 0,
              width: innerFlameW, height: innerFlameH,
              borderRadius: 999,
              backgroundColor: "rgba(255,245,150,1)",
            }} />

            {/* Blue-white core */}
            <View style={{
              position: "absolute", bottom: 2,
              width: compact ? 5 : 7, height: compact ? 13 : 17,
              borderRadius: 999,
              backgroundColor: "rgba(210,230,255,0.9)",
            }} />

            {/* Floating learner name */}
            {showLearner && activeLearner && (
              <Animated.View style={{
                position: "absolute",
                bottom: 8,
                width: 140,
                alignItems: "center",
                opacity: learnerOpacity,
                transform: [{ translateY: learnerY }],
                zIndex: 10,
              }}>
                <Text style={{ fontSize: 9, fontWeight: "800", color: "rgba(255,245,160,0.97)", textAlign: "center" }}>
                  {activeLearner.learnerName}
                </Text>
                <Text style={{ fontSize: 8, color: "rgba(255,220,100,0.85)", textAlign: "center" }}>
                  📖 {activeLearner.studySubject}
                </Text>
              </Animated.View>
            )}
          </>
        ) : (
          /* Unlit wisps */
          <View style={{ position: "absolute", bottom: 10, alignItems: "center" }}>
            <View style={{ width: 3, height: 22, borderRadius: 2, backgroundColor: "rgba(150,140,180,0.4)" }} />
          </View>
        )}
      </View>

      {/* Wick */}
      <View style={{
        width: 2.5, height: 9,
        backgroundColor: isLit ? "#2a1004" : "#2a2038",
        borderRadius: 2,
        zIndex: 2,
      }} />

      {/* Wax body */}
      <View style={{
        width: candleW, height: candleH,
        borderRadius: 8,
        backgroundColor: isLit ? "#f2e3bb" : "#2e2948",
        shadowColor: isLit ? "#ff9628" : "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isLit ? 0.25 : 0.4,
        shadowRadius: isLit ? 12 : 6,
        overflow: "hidden",
      }}>
        {/* Highlight stripe */}
        <View style={{
          position: "absolute", top: 10, left: 6, width: 5, bottom: 10,
          borderRadius: 3,
          backgroundColor: isLit ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.04)",
        }} />
        {/* Wax drip */}
        <View style={{
          position: "absolute", top: 0, left: 6,
          width: 7, height: compact ? 14 : 20,
          borderBottomLeftRadius: 6, borderBottomRightRadius: 6,
          backgroundColor: isLit ? "#eeddb5" : "#2e2948",
        }} />
        <View style={{
          position: "absolute", top: 0, right: 8,
          width: 5, height: compact ? 10 : 14,
          borderBottomLeftRadius: 4, borderBottomRightRadius: 4,
          backgroundColor: isLit ? "#eeddb5" : "#2e2948",
        }} />
      </View>

      {/* Holder */}
      <View style={{
        width: holderW, height: 9,
        borderRadius: 5,
        backgroundColor: isLit ? "#a07820" : "#2c2445",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
      }} />

      {/* Ground glow */}
      {isLit && (
        <Animated.View style={{
          width: compact ? 68 : 86, height: 12,
          borderRadius: 999,
          backgroundColor: "rgba(255,160,40,0.22)",
          marginTop: -2,
          opacity: glowOpacity,
        }} />
      )}

      {/* Name & info */}
      <View style={{ marginTop: isLit ? 2 : 8, alignItems: "center", width: "100%", paddingHorizontal: 4 }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: compact ? 10 : 12,
            fontWeight: "800",
            color: isLit ? "#F5D982" : "#8a7aaa",
            letterSpacing: 0.3,
            textAlign: "center",
          }}
        >
          {deceasedName}
        </Text>

        {yahrzeitNumber !== undefined && yahrzeitNumber > 0 && (
          <Text style={{ fontSize: 8, color: isLit ? "rgba(212,175,55,0.8)" : "rgba(120,110,160,0.65)", fontWeight: "700", letterSpacing: 0.8, marginTop: 2, textTransform: "uppercase" }}>
            {ordinal(yahrzeitNumber)} Yahrzeit
          </Text>
        )}

        {donorName ? (
          <Text numberOfLines={1} style={{ fontSize: 8, color: isLit ? "rgba(255,230,140,0.55)" : "rgba(90,82,120,0.5)", marginTop: 2, fontStyle: "italic" }}>
            lit by {donorName}
          </Text>
        ) : null}

        {learners.length > 0 && (
          <Text style={{ fontSize: 8, color: isLit ? "rgba(255,200,100,0.7)" : "rgba(100,90,140,0.5)", marginTop: 2 }}>
            📖 {learners.length} learning
          </Text>
        )}
      </View>
    </View>
  );
}
