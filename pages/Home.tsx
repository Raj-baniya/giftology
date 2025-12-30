import React from 'react';
import { ChristmasHome } from './themes/ChristmasHome';
import { SparklingHome } from './themes/SparklingHome';
import { useTheme } from '../contexts/ThemeContext';

export const Home = () => {
  const { currentTheme } = useTheme();


  if (currentTheme === 'sparkling') {
    return <SparklingHome />;
  }

  // 'default', 'diwali', 'holi', etc. all use the modern Sparkling theme for now
  return <SparklingHome />;
};