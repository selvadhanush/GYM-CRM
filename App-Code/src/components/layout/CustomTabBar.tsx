import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Platform, Dimensions, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { theme } from '@/design-system/theme';
import { 
  MapPin, 
  ScanLine, 
  Gem, 
  Plus, 
  X,
  CreditCard,
  CalendarPlus,
  Award,
  TrendingUp,
  MessageSquareHeart,
  Calendar,
  History,
  QrCode,
  ShieldAlert,
  Dumbbell,
  Scan,
  BadgeCheck,
} from 'lucide-react-native';

// ── Custom Professional SVG Icons ──
const HomeIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 94">
    <Path fill={color} d="m36 0.7c-30.2 0-31 13.3-32 22.2-0.4 3.1-0.1 5 1 6.8 1.7 2 4.4 3.3 7.6 3.3h23.4c1-0.1 2.7 0.1 4.7-0.5 3.7-1.5 4.7-5.5 4.7-8.5v-13.6c0.1-4.9-3.1-9.7-9.4-9.7z"/>
    <Path fill={color} d="m36.5 42.5h-23-0.6c-5 0-7.9 3.6-8.9 6-0.4 1.5-0.4 3-0.4 3.5v8.5c0.1 16.5 2.9 28.5 17.7 31.4 3.3 0.7 7.3 1.1 14.3 1.2 1.5 0 2.9-0.2 3.7-0.4 3-0.9 6.1-3.7 6.1-8.2v-32.7c-0.2-4.8-3.6-9.3-8.9-9.3z"/>
    <Path fill={color} d="m87.3 60.6h-23.4c-5.4 0-9.5 3.9-9.5 9.3v14.1c0 4.9 3.6 9.1 9.5 9.1 14.9-0.2 22.7-1.1 27.5-7.6 3.4-4.6 4.6-11.5 4.7-15.5s-3.1-9-8.8-9.4z"/>
    <Path fill={color} d="m88.1 6.7c-4.1-3.8-10.2-5.7-19.6-5.8l-4.6-0.1c-0.9 0-2.5 0.2-3.2 0.4-2.8 1-6.3 3.8-6.3 8.6v32.5c0 4.6 3.1 8.1 7 9 1 0.2 2.1 0.3 2.9 0.3h22.5c4.7 0.1 9.5-3.2 9.6-8.8v-8.6c0-5.2-0.2-10.3-0.9-14.2-1.1-5-2.9-10.1-7.4-13.3z"/>
  </Svg>
);

const AttendanceIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 150 150">
    <Path fill={color} d="m75 6.9m0-2h-52c-9.4 0-18.3 7.7-18.3 18.1v104c0 9.3 7.5 18.1 18.3 18.1h52c2.6 0 4.5-2 4.5-4.5s-2-4.5-4.5-4.5h-51.9c-4.8-0.1-9.3-3.7-9.3-9.5v-103.1c0-4.8 3.9-9.2 9.2-9.3h52c3.6 0 4.4-1.2 4.5-4.6 0-2.5-2-4.7-4.5-4.7z"/>
    <Path fill={color} d="m74.8 61.1h-13.6v-14.3c-0.1-4.7-5.1-6.8-8.1-3.6l-28.7 28.8c-1.6 1.8-1.6 4.7 0 6.3l28.8 28.5c2.9 4.7 8.1 0 8-4v-13.9h13.8c2.6 0 4.3-2 4.3-4.6v-18.6c-0.1-2.6-1.8-4.6-4.5-4.6z"/>
    <Path fill={color} d="m117.4 37.5c-10.4 0.2-18.9 8.1-19 18.8 0.1 10 7.8 18.9 19.1 18.9s18.9-8.9 18.8-18.9c-0.2-10.2-8-18.8-18.9-18.8z"/>
    <Path fill={color} d="m136 82.4c-1.3-1.3-3.2-2.1-5.6-1.4-2.6 1.4-6.6 3.2-13 3.2s-10.3-1.7-13.4-3.3c-1.6-0.4-3.4-0.5-5.1 1-3.3 2.8-9.9 9.9-9.9 20.6v5.5c0 2.5 1.8 5 4.9 5h46.9c2.6 0 4.5-2.1 4.5-4.7v-5.5c-0.2-10.4-6.4-17.8-9.3-20.4z"/>
  </Svg>
);

const WorkoutIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 144.5 144.5">
    <Path fill={color} d="m139 38.4-32.9-32.6c-0.8-0.8-1.9-1.3-3.1-1.1l-16.1 2.4c-0.8 0.1-1.5 0.5-2.1 1l-14 13.7c-0.5 0.5-0.9 1.2-1 1.9l-2.5 15.7c-0.2 1.5 0.1 2.3 1.6 3.5l5.5 5.8-3.1 1.1c-0.6 0.2-1.1 0.6-1.5 1l-18.3 19c-0.5 0.6-0.9 1.3-1.1 1.9l-1 3-6.3-6.1c-0.7-0.8-2-1.3-3.3-1.1l-16.2 2.4c-0.8 0.1-1.5 0.5-2 1l-13.8 13.5c-0.6 0.7-1 1.3-1.2 2.2l-2.3 15.9c-0.2 1.1 0.2 2.7 1.1 3.5l32.9 32.6c0.9 1 2.2 1.5 3.4 1.3l16.2-2.5c0.8-0.1 1.6-0.5 2.2-1l13.2-13.2c0.7-0.6 1.1-1.4 1.2-2.1l2.2-15.9c0.3-1.1-0.1-2.6-0.9-3.5l-6-6.7 2.8-1c0.7-0.1 1.3-0.6 1.8-1l18.3-17.7c0.7-0.6 1.1-1.3 1.4-2.1l1-3 6.2 5.7c0.8 0.9 2.1 1.7 3.4 1.4l16.1-2.4c0.8-0.1 1.7-0.6 2.2-1.1l13.5-13.5c0.7-0.6 1.1-1.6 1.3-2.3l2.4-16.1v-0.9c-0.1-1-0.5-1.9-1.2-2.6z"/>
  </Svg>
);

const DietIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 115.8 116.7">
    <Path fill={color} d="m56.3 7.6v8c19.1 0.4 37.6 15.7 37.6 39.2l-0.1 3.4c2-1.8 4.5-3.2 7.9-3.2h0.7c-0.1-27.2-20.3-46.8-46.1-47.4z"/>
    <Path fill={color} d="m50.9 3.9c-25.3 0-46.8 21.1-47.4 44.1v3.1h47.4v-47.2zm-25.7 18c2 0 3.8 1.7 3.8 3.7s-1.7 3.6-3.7 3.6-3.7-1.6-3.7-3.6 1.6-3.7 3.6-3.7zm3.8 17.9c-0.6 0.7-1.3 1.1-2.2 1.1-2.4 0.1-3.4-2.7-2.4-4.5l12-14.3c2.3-2.5 6-0.1 4.6 3l-12 14.7zm11.1 0.1c-1.9-0.1-3.8-1.8-3.8-3.9 0-2 1.7-3.4 3.6-3.4 2 0 3.8 1.4 3.8 3.4 0 2.1-1.6 3.9-3.6 3.9z"/>
    <Path fill={color} d="m54.4 93.8c-20.7 0-37.7-15.6-39.2-37.2h-8.2c1.1 25.1 20.9 45.5 47.5 45.5 3.7 0 8.1-0.4 13.1-1.8l0.3-8.8c-0.9 0.3-6 2.3-13.5 2.3z"/>
    <Path fill={color} d="m56.4 21.1v31.9c0 1.8-1.6 3.6-3.5 3.6h-32.2c0.7 15.2 13.5 32.1 33.6 32.1 3.2 0 6.2-0.5 8.5-1-2.4-2.1-3.8-5.3-3.8-9.5v-15.2c0-3.1 2.5-6.4 6.4-6.4h22.6l0.5 0.1s0.1-1.5 0.1-2.7c0-16.2-14-31.8-32.2-32.9z"/>
    <Path fill={color} d="m87.4 61.9h-3.4c-0.5 0-1.1 0.4-1.1 1.1v15.2c0 0.5-0.4 0.8-0.8 0.8h-3v-16.1c0-0.5-0.5-1-1.1-1h-3.3c-0.5 0-1 0.4-1 1v16.1h-2.9c-0.4 0-0.8-0.3-0.8-0.8v-15.2c0-0.6-0.4-1.1-1-1.1h-3.4c-0.6 0-1.2 0.5-1.2 1.1v15.1c0 3.3 2.6 6.8 6.2 6.8h3l-0.7 24.3c0.1 2.1 1.6 3.6 3.5 3.6 1.9 0.1 3.9-1.5 3.6-4l-0.8-23.9h2.9c3.8 0 6.4-2.9 6.4-6.2v-15.7c0-0.6-0.5-1.1-1.1-1.1z"/>
    <Path fill={color} d="m102.2 60.2c-5.5-0.6-10.2 6.8-10.3 13.5-0.1 5.2 2.4 10.1 7.4 11.9l-0.6 23.4c-0.1 2.1 1.6 3.8 3.7 3.8 2 0 3.6-1.5 3.5-3.9l-0.7-23.5c4.9-1.1 7.1-4.9 7-11.7-0.1-5.6-4.2-13-10-13.5z"/>
  </Svg>
);

const ProfileIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 150 168">
    <Path fill={color} fillRule="evenodd" clipRule="evenodd" d="m74.9 84.2c21.4 0 38.2-16.8 38.3-38.4 0.1-20.4-16.4-38-38.5-38-19.6 0-38.2 16.5-38.2 37.6 0 20.2 15.9 39 38.4 38.8z"/>
    <Path fill={color} fillRule="evenodd" clipRule="evenodd" d="m109.4 92.7h-68.8c-16.6 0-33.7 12.5-33.7 34s15.6 33.8 33.7 33.8h68.9c16.3 0 34-12.5 34-33 0-18.2-13.5-34.8-34.1-34.8z"/>
  </Svg>
);

const GymsIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size * 1.8} height={size} viewBox="0 0 150 74">
    <Path fill={color} d="m136 8.4-2.1-0.1c-1.1 0-2.8 0.3-3.7-1.3-1.6-2.5-2.4-5.5-5.2-5.6l-11.1-0.3c-5.3 3.8-8.5 17.3-9.3 31.2h-5v-2.9c-0.2-6.9-4.2-8-9.6-5.3-1.1-4.6-7.2-7.6-11.1-2.8-2.4-5.3-5.7-6.8-9.7-4.9-1.3 0.7-3.3 2.2-4.5 4.7-1.8-2.5-4.1-4.6-6.6-3.8-4.4 1.6-6.9 7.9-7 14.9h-5.8c-0.6-12.5-3.5-24.8-8.9-30l-12.4 0.3c-3.1 0.3-3.9 4.6-5.4 6.4-0.7 0.8-3.1 0.6-5.2 0.6-5.5 0.6-8.3 14-8.3 27.5 0 11 2 28 7.5 28.1 2.2 0.1 4.3-1 5.9 1.5 0.7 1.3 3.4 5.4 5.9 6 2.7 0.4 8.7 0.6 11.7 0 4-0.5 8.8-11.4 9.3-29.8h5.5c0.5 3.2 1.2 5.7 2.6 7.6-1 1.6-1.6 3.2-1.4 4.7 1 4.9 5.8 7.3 11.4 9.1 4.6 1.4 10 1.9 9.6-5.1l-0.1-2.5c1.6 1 3.6 0.3 4.8-1.8 1.7 2.8 7.7 4.3 11.1-1.2 4.5 2.5 9-0.7 10.3-8.8l0.2-2.3h5c0.6 11.9 3.1 24.1 8 28 1.1 1.1 8.2 1.6 13.2 1 2.5-0.5 4.8-3.5 6.3-6.1 1.2-2 4.2-1.3 5-1.4 5.5 0.1 8.2-13.9 8.2-27.4s-2.6-28-9.1-28.2zm-121.7 42.1h-5.8l-0.4-25.9h6.2v25.9zm3.3 3c-1.5-10.4-1.7-21.5 0-32.1l6.7-0.3c-1.3 10.9-1.4 21.9 0 32.4h-6.7zm17.3 16.7c-9.4 0.2-11.3-50.3-3-63.7 7-10.3 11 13.5 10.8 25.7l-1.3-0.1c0-6.5-2-19.2-7.7-23.7 2.8 6.7 5.2 15.2 5.4 23.8h-2.2c1.1-4.2-1.9-6-3.8-3.8-3 4.1-1.2 20.2 1.6 20.4 1.8 0.1 2.3-4.6 2.7-6h1.6c-0.4 7.2-2.4 16.7-5.9 24.3 4.5-4.7 6.8-14.2 8-24.3l1.6-0.1c-0.1 6.7-1.8 27.3-7.8 27.5zm36.3-10.2c-2.2 2.9-7.7 1.5-11.7-1-2.5-1.4-5.3-3.6-5.1-6.4 4.2 2.8 7.5 5 12.6 1.6 3 0.8 6 3.4 4.2 5.8zm25.5-16c-1.2 5.4-3.3 10.5-6.3 8.5 1-3.4 0.5-15 0.5-15.1-0.4-1.9-2-1-2-0.2 0 5.8 1.1 16.9-5 16.7-5.5-0.3-4.4-8.5-4.5-14.4 0.1-4.1 0.5-7.3-0.8-7.5-1 0-1 0.9-0.7 3.1 0.5 10.8-0.5 19.9-4.7 19.1-2.2-0.3-3.8-1.8-3.2-4.7 0.4-5.3-0.8-13-2.4-16.1-1.6-0.4-1.5 0.8-1.2 1.6 1 4.1 2.5 13.5-1.4 17.2-3.9 3.3-8.5-1.8-9.6-6.6-1.4-6.4-0.4-13.6-0.5-20.8-0.2-3.9 7.6-8.8 9.3-0.6l-0.2 3.2c5.7-11.3 11.7-12 14.5-1.9l1.4-0.1c0-5.5 7-4.8 9 4 7.2-6.5 8-2.9 7.3 7.5l0.5-0.3v3.4h-0.7 0.7zm18.7-40.6c7.8-0.6 11.2 47.2 2.2 64.1-6.1 7.1-9.7-10.9-10.5-25h1.9c0.6 6.5 2.4 18.1 7.6 23.5-2.4-5.6-5-14-5.5-23.5h3c0.5 7.4 1.8 6 2.5 5.1 2.9-4.6 3.5-15.7 0.5-20.2-2-1.9-2.9 0.6-3.2 4.8l-2.9 0.2c0-7.5 2.4-17.8 5.2-25-4.6 4.1-7.2 15-7.6 24.8l-1.6 0.2c0.4-12.5 2.9-27.8 8.4-29zm17.1 49v0.1-0.1zm0.1 0h-7c1.5-10.6 1.4-21 0-32.4l6.9 0.1c1.9 10.3 1.6 21 0.1 32.3zm9-3-5.9 0.1-0.1-26h6.1l-0.1 25.9z" />
  </Svg>
);

// ── Custom H4 Operation Icons ──
const BookClassIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 155.9 120">
    <Path fill={color} d="m151.3 80-9.9-56.3c-0.8-4.3-4.8-7.7-9.2-7.7h-6.5v-6c0-2.7-2.2-5.2-5.2-5.2s-5.7 2.3-5.7 5.2v5.8h-12.3v-5.8c-0.2-2.9-2.6-5.4-5.8-5.3-2.9 0-5.5 2.4-5.5 5.3v5.8h-12.3v-5.5c0-2.9-2.3-5.7-5.5-5.6-3.1-0.1-5.4 2.7-5.4 5.6v5.6h-12.2v-5.8c0-2.8-2.4-5.3-5.4-5.3s-5.5 2.5-5.5 5.3v5.8h-5.9c-5.8 0-10.2 4.3-10.2 9.5v39c-12.2 0.9-24.2 11.4-24.2 26.9 0.1 14.6 11.1 27.2 26.9 27.3 13.3 0.1 24.1-8.6 27.1-21.2h73.4c4.6 0 8.8-3.5 9.5-8.6h2.5c4.5 0 8.2-4.2 7.3-8.8zm-33.1-69.7c0-1.1 0.9-2.2 2.1-2.2 1.1 0 2 1.1 2 2.2v13.8c-0.1 2.7-4.1 2.7-4.1 0v-13.8zm-23.5 0c0-1.1 0.9-2.3 2-2.3s2.1 1.2 2.1 2.1v13.7c0 2.8-4 3-4.1 0v-13.5zm-23.4 0c0-1.1 1-2.3 2.1-2.3 1.2 0 2 1.1 2 2.1v14c0 2.7-4.1 2.8-4.1 0v-13.8zm-23.5 0c0-1.1 1-2.3 2.2-2.3 1.1 0 2.2 1 2.2 2.3v13.8c-0.1 2.7-4.3 2.9-4.4 0v-13.8zm0.2 84c0 2-1.6 3.7-3.6 3.7h-6.2v5.8c0 2.1-1.7 3.7-3.9 3.7h-5.4c-2.1 0-3.7-1.6-3.7-3.7v-5.8h-6.1c-2.1 0-4-1.6-4-3.7v-5.5c0-2.2 1.7-4.2 3.8-4.2h6.2v-6c0-2.2 1.7-3.8 3.7-3.8h5.2c2.5 0 4.2 1.4 4.2 3.9v5.5h5.8c2.4 0.1 4 1.8 4 4.5v5.6zm90.2-7.3c0 3.3-2.5 6.8-6.5 6.8h-72.7c0.3-4.5-0.4-9.4-2.2-13.8h0.2c2.3-0.1 2.3-3.4 0-3.5h-2.1c-4.2-6.5-12.3-12.1-22.7-12.1v-26.3h106v48.9z"/>
    <Path fill={color} d="m34.4 86.5v-8.2h-5.8l-0.2 8.2c0 0.9-0.8 1.8-1.8 1.8h-7.7c-0.2 0-0.3 0.2-0.3 0.5v5.5l8 0.3c1.1 0 1.4 0.8 1.8 1.4l0.2 8.1h5.7c0.1 0 0.2 0 0.2-0.4v-7.4c0-1 0.9-1.6 2-1.7h7.9l0.1-6.2-8-0.1c-1.1 0-1.9-0.6-2.1-1.8z"/>
    <Path fill={color} d="m43.6 49.9h13.4c2.4 0 2.4-3.4 0-3.4h-13.3c-2.3 0.1-2.7 3.2-0.1 3.4z"/>
    <Path fill={color} d="m57 61.6h-13.3c-2.3 0-2.9 3.4-0.3 3.5h13.6c2.5 0.3 2.7-3.5 0-3.5z"/>
    <Path fill={color} d="m78.3 49.8h13.4c1.9 0 2.4-3.2-0.1-3.3h-13.3c-2.2 0.1-2.3 3.2 0 3.3z"/>
    <Path fill={color} d="m78.3 65.1h13.3c2-0.1 2.6-3.3-0.2-3.5h-13.1c-2 0-2.3 3.4 0 3.5z"/>
    <Path fill={color} d="m113.5 49.9h13.1c2.5 0 2.2-3.4 0.1-3.4h-13.3c-2.3 0.1-2.4 3.1 0.1 3.4z"/>
    <Path fill={color} d="m113.5 65h13.1c2.4 0.3 2.5-3.4 0.1-3.4h-13.3c-2.3 0.1-2.4 3.5 0.1 3.4z"/>
    <Path fill={color} d="m78.4 79.6h13.1c2.3 0 2.6-3.1 0-3.2h-13.2c-2 0.2-2.4 3.2 0.1 3.2z"/>
    <Path fill={color} d="m113.5 79.7h13.1c2.4 0.2 2.4-3.2 0-3.3h-13.2c-2.3 0.1-2.4 3.3 0.1 3.3z"/>
    <Path fill={color} d="m99.8 85.3h-29.5c-1.8 0.5-2.5 3.3 0.2 3.8h29.1c2.3 0 2.6-3.7 0.2-3.8z"/>
  </Svg>
);

const PTBookingIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 155.9 143">
    <Path fill={color} d="m147 43.4h-17v38.6l17.8-4c2.2-0.7 3.5-2.2 3.5-4.3v-26c0-2.3-2-4.3-4.3-4.3z"/>
    <Path fill={color} d="m87.2 47.7v4.8h-8.6v-4.6c0-2.3-1.8-4.3-4.2-4.3h-14.3c-7.1 0-13.9 1.3-21.9 4.8l-5.7-5.2c4.1-2.3 8.1-6.5 10.9-10.6 3.4-5.2 5.4-10.3 5.2-15.1-0.2-5.1-3.2-10.5-9.7-12.3-7.9-1.7-17.8 2.3-25 10.2-4.7 5-8.9 11.6-9.3 18.1-0.3 5 1.5 9.9 5.2 12l-2.6 3.1c-1.3 1.4-1.2 4.1 0.2 5.6l10.5 11c-3.8 5.6-6.4 12.1-7.6 19.2-0.2 2-0.3 4.2-0.3 6.4 0.1 21.2 12.9 40.3 34 45.6 2.8 0.8 5.7 1.2 8.6 1.6l5.2 0.1c18.6 0 38.1-10.5 44.6-32.3 0.5-1.5 1-3.9 1.6-5.8 2.2-8 9.1-13.5 17.8-15.4v-41.2h-30.2c-2.5 0-4.4 2-4.4 4.3zm-73.3-10.3c-0.5-1.3-0.9-3.8 0.2-6.6 3-7.8 12.4-17 20.5-17.4 4.7-0.2 5.6 2.5 5.4 5.6-0.5 7.1-7.2 14.9-13.8 18.2l-0.7-0.8c-1.5-1.4-4-1.7-5.9 0l-3.3 3c-1.5-0.3-2-0.9-2.4-2zm43.5 75.3c-11.8 0-21.7-9-21.8-21.9 0.3-10.3 8.4-19.5 18.4-20.9l2.8-0.3h1c10.1 0 20.1 7.3 20.8 19 0.8 11-7.5 21.3-19.2 23.8-0.6 0.1-1.5 0.3-2 0.3z"/>
    <Path fill={color} d="m57.6 78.2c-6.6 0.2-13.2 5.2-13.2 12.3s5.1 13.5 13.2 13.5c6.9 0 12.3-5 12.6-12.2 0.2-6.6-5-13.6-12.6-13.6z"/>
  </Svg>
);

const RenewIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 117.6 114">
    <Path fill={color} d="m66 33.7-9.7-16.8c-3.2-4.8-6.2-9.8-13.4-9.9-3-0.1-6.5 0.7-9.3 2.1 3-2.9 6.4-4.6 10.1-5.1 1.5-0.3 3.5-0.4 5.3-0.4h20c7.8 0 12.3 0.2 15.8 5.1 2.2 2.7 4.3 7.4 6.1 10.3l0.4 0.8 7.3-4.2-13.5 22.7h-13c-4.9 0-8.9 0.6-13.5 0.2l0.2-0.3 7.2-4.5z"/>
    <Path fill={color} d="m43.9 44.6-23-13.3 10.3-17.3c1.8-2.4 5.7-5.1 10-5.1 4.3-0.1 8.6 1.8 11.2 5.8l4 7.5-12.5 22.4z"/>
    <Path fill={color} d="m74.3 64.8v8.6c7.5-0.2 13.4 0.2 19.7 0 6.2-0.1 10.4 0 14-4 2.6-2.6 4.8-6.5 4.9-11 1.5 2.3 1 5.6 0.3 8.6-1.2 3.9-4.2 8.2-6.1 11.6l-8.3 13.9c-4.4 7.3-7.6 9.8-15.6 9.6-3.6-0.1-5.8-0.1-8.8 0v8.4l-13.4-22.3 13.3-23.4z"/>
    <Path fill={color} d="m76.7 49.1 22.8-13.6 10.1 18.5h0.6c0.1 3.3 0.2 6.3-0.6 8.7-1.8 4.9-5.9 8.4-12.6 8.3h-7.1l-13.2-21.9z"/>
    <Path fill={color} d="m3.8 42.6h26.7l13.5 23-7.9-4.5c-4 7.5-13.6 20.9-13.7 27.4s4.5 11.1 8.1 13.6c-3.2-0.8-6.1-2.3-7.9-4.1s-3-4.4-4.4-6.8l-10.5-18.2c-2.3-4.2-3.9-7.7-3.2-12 1.1-4.9 5-9 6.7-14l-7.4-4.4z"/>
    <Path fill={color} d="m56.4 75.2v26.3l-20.4 0.1c-4-0.5-8.2-3.1-10-7.7-1-2.6-1.5-5.9-0.3-9.2 1-2.6 3.3-5.8 4.8-9.4l25.9-0.1z"/>
  </Svg>
);

const BodyInBodyIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 116.7 114">
    <Path fill={color} d="m93.8 36.5-34.7-20.2c-1.9-1.1-4.4-0.8-5.8 0.9-2.1 2-2 5.4 0.7 7.7l-5.2 8.7c-2 4.1-2.5 10.3 0.4 16 0.4 0.5-0.1 2.4-1.3 2.4-6.3 0.2-11.7 3.5-14.9 8l-5 8.2 0.1-0.2c-3.8-2-7.9 0.9-7.9 4.3 0 1.4 0.8 3.2 2.2 4l35.3 21.4c3.4 2.2 7.3-0.6 7.1-3.9 0.2-1.8-0.7-3.3-2.2-4.5l5-8.5c1.9-4 3.1-11.2-0.3-17.6l0.5-0.9 5-0.6c4.6-1.1 8.8-3.7 11.4-7.5l4.7-8.3v-0.1l0.7 0.2c5 1.8 8.8-3.6 6-7.9l-0.7-0.7-1.1-0.9z"/>
    <Path fill={color} d="m58.5 2.8c-13.5 0-25.5 4.6-34.9 12.8-1.3 1.1-2.6 2.3-4.4 3.8v-4.8c0-2.1-1.4-4.1-4.2-4.1-1.9 0-3.6 1.8-3.6 3.5v14.4c0 2.2 1.8 3.6 3.6 3.6h14.9c1.7 0 3.6-1.5 3.6-3.6s-1.8-3.9-3.6-3.9h-5.2c8.2-7.5 17.9-12.4 27.3-13.6 2.4-0.2 4.7-0.4 6.5-0.4 22.6 0 46.7 17.6 46.7 46.5 0 2.1 1.7 3.8 3.8 3.8s3.8-1.7 3.8-3.8c0-30.1-24.6-54.2-54.3-54.2z"/>
    <Path fill={color} d="m101.6 81.9c-0.3 0-0.3 0-0.2 0.1h-14.5c-1.6 0-3.8 1.6-3.9 3.7 0 2.4 1.9 3.9 3.6 3.9h5.6c-9.4 9.5-20.9 13.2-28.1 14-2.1 0.2-4.2 0.3-5.9 0.3-24.3 0-46.8-19.2-46.8-46.8 0-2-1.6-3.7-3.8-3.7-1.8 0.1-3.5 1.5-3.6 3.6v1.1l0.1 3.4c1.5 22.6 19.5 48.3 49.5 49.5l4.8 0.2c14 0 26.4-4.4 36.8-13.6l2.3-2.6v4.8c0 1.9 1.3 4 3.9 4 2.2 0 3.8-1.6 3.8-3.6v-14.3c0-1.7-1.3-3.7-3.6-4z"/>
  </Svg>
);

const HelpCenterIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="14 9.5 88 86">
    <Path fill={color} d="m70.2 37.7h-23.9c-4.2 0-8.8 3.4-8.8 9v11.4c0 4.9 3.5 8.8 8.8 8.8h8.7l9.3 8.4c1.1 1.1 3.2 0 2.4-1.6l-2.9-6.7h5.6c5.1 0 9.1-3.5 9.1-8.7v-11.3c0.1-5.3-3.5-9.3-8.3-9.3z"/>
    <Path fill={color} d="m90.3 43.8c0-16.5-13.3-32.1-32.3-32.1-18 0-32.3 14-32.4 32.1-2.5 1.1-8.6 4.5-8.7 8.4v5.9l0.2 2.1c0.8 3.6 3.8 6.7 8.5 6.7h2.9c1.5 0 2.9-1.1 2.9-2.9v-20.2c0-13.4 10.2-26.4 26.5-26.5 13.4 0 25.9 10 26.5 24.8v21.8c0 1.7 1.2 3 2.7 3h2.8c4 0 7.4-1.9 8.6-5.9 0.2-0.6 0.3-1.8 0.3-2.8v-5.4c0.3-3.9-6-7.8-8.5-9zm-3.3 26.3c-0.8 5.8-6.2 14.2-17 14.7h-4c-1.1-1.5-2.4-2.9-5.3-2.9h-5.7c-3 0-5.7 2.5-5.7 5.5s2.1 5.5 5.6 5.5h5.8c2.7 0 4.1-1.3 5.2-2.8h3.5c11.2 0 20.5-7.2 23.2-17.1 0.3-1.1 0.6-2.3 0.7-3.2h-5.8v0.3z"/>
  </Svg>
);

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  portalType: 'h4' | 'fitpass';
}

export const CustomTabBar: React.FC<CustomTabBarProps> = ({ state, descriptors, navigation, portalType }) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  
  const animatedVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (modalVisible) {
      Animated.spring(animatedVal, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }).start();
    } else {
      Animated.timing(animatedVal, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [modalVisible]);

  const handleClose = () => {
    Animated.timing(animatedVal, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => setModalVisible(false));
  };

  const getTabIconAndLabel = (routeName: string, focused: boolean) => {
    const activeColor = portalType === 'h4' ? theme.colors.primary : '#2563EB';
    const inactiveColor = theme.colors.textSecondary;
    const iconSize = 22;

    if (portalType === 'h4') {
      switch (routeName) {
        case 'dashboard':
          return { label: 'Home', icon: <HomeIcon color={focused ? activeColor : inactiveColor} size={iconSize} /> };
        case 'attendance':
          return { label: 'Check-In', icon: <AttendanceIcon color={focused ? activeColor : inactiveColor} size={iconSize} /> };
        case 'workouts':
          return { label: 'Workouts', icon: <WorkoutIcon color={focused ? activeColor : inactiveColor} size={iconSize} /> };
        case 'diets':
          return { label: 'Diet', icon: <DietIcon color={focused ? activeColor : inactiveColor} size={iconSize} /> };
        case 'profile':
          return { label: 'Settings', icon: <ProfileIcon color={focused ? activeColor : inactiveColor} size={iconSize} /> };
        default:
          return { label: 'Tab', icon: <HomeIcon color={inactiveColor} size={iconSize} /> };
      }
    } else {
      switch (routeName) {
        case 'dashboard':
          return { label: 'Home', icon: <HomeIcon color={focused ? activeColor : inactiveColor} size={iconSize} /> };
        case 'gyms':
          return { label: 'Gyms', icon: <GymsIcon color={focused ? activeColor : inactiveColor} size={iconSize} /> };
        case 'scan':
          // Scanner beam icon — distinct from QrCode grid; signals active camera scanning
          return { label: 'Scan In', icon: <Scan color={focused ? activeColor : inactiveColor} size={iconSize} strokeWidth={focused ? 2.5 : 2} /> };
        case 'plans':
          // BadgeCheck signals verified/active membership plan better than a gem
          return { label: 'Plans', icon: <BadgeCheck color={focused ? activeColor : inactiveColor} size={iconSize} strokeWidth={focused ? 2.5 : 2} /> };
        case 'profile':
          return { label: 'Settings', icon: <ProfileIcon color={focused ? activeColor : inactiveColor} size={iconSize} /> };
        default:
          return { label: 'Tab', icon: <HomeIcon color={inactiveColor} size={iconSize} /> };
      }
    }
  };

  const getQuickActions = () => {
    const iconColor = theme.dark ? '#FFFFFF' : '#010101';
    if (portalType === 'h4') {
      return [
        { name: 'Book Class', path: '/(h4)/classes', icon: <BookClassIcon color={iconColor} size={28} />, desc: 'Group workouts' },
        { name: 'PT Booking', path: '/(h4)/pt-sessions', icon: <PTBookingIcon color={iconColor} size={28} />, desc: 'Trainer slot' },
        { name: 'Renew Plan', path: '/(h4)/payments', icon: <RenewIcon color={iconColor} size={28} />, desc: 'Quick payment' },
        { name: 'Body InBody', path: '/(h4)/assessments', icon: <BodyInBodyIcon color={iconColor} size={28} />, desc: 'Muscle & Fat' },
        { name: 'Help Center', path: '/(h4)/support', icon: <HelpCenterIcon color={iconColor} size={28} />, desc: '24/7 Support' },
      ];
    } else {
      return [
        { name: 'Training', path: '/(fitpass)/workouts', icon: <Dumbbell color={iconColor} size={28} />, desc: 'Gym routine' },
        { name: 'Diet Charts', path: '/(fitpass)/diets', icon: <DietIcon color={iconColor} size={28} />, desc: 'Calorie counts' },
        { name: 'Attendance', path: '/(fitpass)/history', icon: <History color={iconColor} size={28} />, desc: 'Visit history' },
        { name: 'Scan Entry', path: '/(fitpass)/scan', icon: <QrCode color={iconColor} size={28} />, desc: 'Punch In' },
        { name: 'Nearby Gyms', path: '/(fitpass)/gyms', icon: <MapPin color={iconColor} size={28} />, desc: 'Find locations' },
      ];
    }
  };

  const targetRoutes = portalType === 'h4'
    ? ['dashboard', 'attendance', 'workouts', 'diets', 'profile']
    : ['dashboard', 'gyms', 'plans', 'profile'];

  const visibleRoutes = targetRoutes
    .map((name) => state.routes.find((r: any) => r.name === name))
    .filter(Boolean);

  const handleActionSelect = (path: string) => {
    handleClose();
    router.push(path as any);
  };

  const backdropOpacity = animatedVal;
  const cardScale = animatedVal.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] });
  const cardTranslateY = animatedVal.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });
  const closeButtonRotate = animatedVal.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '0deg'] });

  return (
    <View style={[styles.mainWrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={[styles.capsuleContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        {visibleRoutes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === state.routes.findIndex((r: any) => r.key === route.key);
          const { icon, label } = getTabIconAndLabel(route.name, isFocused);
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };
        return (
            <TouchableOpacity key={route.key} onPress={onPress} style={[styles.tabItem, isFocused && [styles.tabItemActive, { 
              backgroundColor: portalType === 'h4' 
                ? (theme.dark ? '#3A3025' : '#FFF0EA') 
                : (theme.dark ? '#1E3A5F' : '#EFF6FF') 
            }]]} activeOpacity={0.8}>
              {icon}
              {isFocused && <Text style={[styles.tabLabel, { color: portalType === 'h4' ? theme.colors.primary : '#2563EB' }]}>{label}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity 
        style={[
          styles.plusButton, 
          { 
            backgroundColor: portalType === 'fitpass' ? '#2563EB' : theme.colors.primary,
            opacity: (modalVisible && portalType === 'h4') ? 0 : 1
          }
        ]} 
        onPress={() => {
          if (portalType === 'fitpass') {
            // Directly open scanner — no modal
            router.push('/(fitpass)/scan' as any);
          } else {
            setModalVisible(true);
          }
        }}
        activeOpacity={0.85}
      >
        {portalType === 'fitpass'
          ? <Scan color="#FFFFFF" size={26} strokeWidth={2.5} />
          : <Plus color="#FFFFFF" size={26} />
        }
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent onRequestClose={handleClose}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
          {/* Animated Backdrop */}
          <Animated.View style={[styles.modalBackdrop, StyleSheet.absoluteFill, { opacity: backdropOpacity }]} />
          
          {/* Animated Menu Card */}
          <Animated.View 
            style={[
              styles.modalContent, 
              { 
                backgroundColor: 'transparent',
                borderWidth: 0,
                bottom: Math.max(insets.bottom, 12),
                height: 275,
                opacity: animatedVal,
                transform: [
                  { scale: cardScale },
                  { translateY: cardTranslateY }
                ]
              }
            ]}
          >
            {/* SVG Background with Square Step Cutout */}
            <View style={StyleSheet.absoluteFill}>
              <Svg 
                width={Dimensions.get('window').width - 32} 
                height={275} 
                viewBox={`0 0 ${Dimensions.get('window').width - 32} 275`}
              >
                <Path
                  d={`M 24 0 L ${(Dimensions.get('window').width - 32) - 24} 0 Q ${(Dimensions.get('window').width - 32)} 0 ${(Dimensions.get('window').width - 32)} 24 L ${(Dimensions.get('window').width - 32)} ${275 - 76} L ${(Dimensions.get('window').width - 32) - 76} ${275 - 76} L ${(Dimensions.get('window').width - 32) - 76} 275 L 24 275 Q 0 275 0 ${275 - 24} L 0 24 Q 0 0 24 0 Z`}
                  fill={theme.colors.background}
                  stroke={theme.colors.border}
                  strokeWidth={1.5}
                />
              </Svg>
            </View>

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Operations & Features</Text>
              <Text style={[styles.modalSubTitle, { color: theme.colors.textSecondary }]}>Quick access to shortcuts</Text>
            </View>
            <View style={styles.actionsGrid}>
              {getQuickActions().map((action, idx) => (
                <View key={idx} style={styles.actionItemContainer}>
                  <TouchableOpacity style={[styles.actionSquare, { backgroundColor: theme.dark ? '#3A3025' : '#EAE7E1' }]} onPress={() => handleActionSelect(action.path)} activeOpacity={0.75}>
                    {action.icon}
                  </TouchableOpacity>
                  <Text style={[styles.actionLabel, { color: theme.colors.text }]} numberOfLines={1}>{action.name}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Animated Close Action Button inside modal */}
          <Animated.View
            style={[
              styles.closeButton, 
              { 
                backgroundColor: theme.colors.primary, 
                bottom: Math.max(insets.bottom, 12) + 8, // Center vertically inside 76x76 notch
                right: 24, // Center horizontally inside 76x76 notch
                opacity: animatedVal,
                transform: [
                  { rotate: closeButtonRotate }
                ]
              }
            ]}
          >
            <TouchableOpacity style={styles.closeButtonTouchable} onPress={handleClose} activeOpacity={0.85}>
              <X color="#FFFFFF" size={26} />
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
  capsuleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderWidth: 1.5,
    marginRight: 10,
    flex: 1,
    height: 60,
    justifyContent: 'space-around',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 8 },
    }),
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 40,
  },
  tabItemActive: { gap: 4, paddingHorizontal: 12 },
  tabLabel: { fontSize: 11, fontWeight: '700' },
  plusButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10 },
      android: { elevation: 10 },
    }),
  },
  modalBackdrop: { backgroundColor: 'rgba(0, 0, 0, 0.45)' },
  modalContent: {
    position: 'absolute',
    left: 16,
    right: 16, // Change to 16 to span full width for Svg background notch
    height: 275,
    borderRadius: 24,
    borderWidth: 0,
    padding: 20,
    paddingBottom: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 15 },
      android: { elevation: 16 },
    }),
  },
  modalHeader: { marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '900', textTransform: 'uppercase' },
  modalSubTitle: { fontSize: 13, marginTop: 2 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', rowGap: 20 },
  actionItemContainer: { width: '25%', alignItems: 'center', justifyContent: 'center' },
  actionSquare: {
    width: 62,
    height: 62,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  actionLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center', width: '100%' },
  closeButton: {
    position: 'absolute',
    right: 16,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 0,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10 },
      android: { elevation: 10 },
    }),
  },
  closeButtonTouchable: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
});
