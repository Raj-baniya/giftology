import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { DefaultHome } from './themes/DefaultHome';
import { ChristmasHome } from './themes/ChristmasHome';
import { DiwaliHome } from './themes/DiwaliHome';

export const Home = () => {
  const { currentTheme } = useTheme();

  // Show festive homepage variants for special themes
  if (currentTheme === 'christmas') {
    return <ChristmasHome />;
  }

  if (currentTheme === 'diwali') {
    return <DiwaliHome />;
  }

  // Default homepage
  return <DefaultHome />;
};