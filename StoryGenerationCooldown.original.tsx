import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

// Eğer projede supabase yolu farklıysa burayı değiştir:
// import { supabase } from "@/lib/supabase";

const { width } = Dimensions.get("window");

type LearnedWord = {
  id: string;
  word: string;
  meaning: string;
  example?: string;
  status?: "Yeni" | "Öğreniliyor" | "Mastered";
};

type Props = {
  onComplete: () => void;
  storyPreview?: string;
  words?: LearnedWord[];
};

const TOTAL_SECONDS = 60;

const fallbackWords: LearnedWord[] = [
  { id: "1", word: "journey", meaning: "yolculuk", example: "My journey starts today.", status: "Öğreniliyor" },
  { id: "2", word: "dream", meaning: "hayal", example: "My dream is big.", status: "Yeni" },
  { id: "3", word: "window", meaning: "pencere", example: "The window is open.", status: "Mastered" },
];

const funFacts = [
  { title: "Günün İlginç Bilgisi", text: "Bir dili daha kalıcı öğrenmenin en güçlü yollarından biri, kelimeleri tek başına değil; hikâye, duygu ve bağlam içinde görmektir." },
  { title: "Dil Hafızası İpucu", text: "Bildiğin kelimelerin arasına az sayıda yeni kelime eklemek, beynin anlamı tahmin etmesini kolaylaştırır ve öğrenmeyi hızlandırır." },
  { title: "WordLoop Notu", text: "Bir kelimeyi farklı hikâyelerde tekrar görmek, onu ezberden çıkarıp gerçek kullanıma yaklaştırır." },
];

// NOT: Bu dosya sadece YAPISAL/sözdizimi referansıdır (Animated API,
// useEffect timer deseni). Görsel diller, faz süreleri, kelime kartı
// davranışı ve "hazır" buton mantığı için story-loading-screen-v5.html
// GEÇERLİ VE GÜNCEL referanstır — bu dosyayla çelişirse HTML kazanır.

export default function StoryGenerationCooldown({ onComplete, storyPreview, words }: Props) {
  const [remaining, setRemaining] = useState(TOTAL_SECONDS);
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [learnedWords, setLearnedWords] = useState<LearnedWord[]>(
    words && words.length > 0 ? words.slice(0, 3) : fallbackWords
  );
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [typedText, setTypedText] = useState("");

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const fullPreview = storyPreview || "Sara loves to travel. Today, she is at the airport and ready for a new adventure.";
  const activeFact = useMemo(() => funFacts[remaining % funFacts.length], [remaining]);
  const progress = (TOTAL_SECONDS - remaining) / TOTAL_SECONDS;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    Animated.timing(progressAnim, { toValue: progress, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: false }).start();
  }, [progress, progressAnim]);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          Animated.timing(fadeAnim, { toValue: 0, duration: 650, easing: Easing.out(Easing.ease), useNativeDriver: true }).start(() => onComplete());
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [fadeAnim, onComplete]);

  const toggleFlip = (id: string) => {
    setFlippedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // ... (görsel JSX/StyleSheet kısmı story-loading-screen-v5.html referansına
  // göre yeniden kurulacak — bu dosyadaki eski stiller/renkler kullanılmayacak)

  return null;
}
