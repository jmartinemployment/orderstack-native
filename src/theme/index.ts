import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { LIGHT_COLORS, DARK_COLORS, type ColorTokens } from '@constants/colors';
import { SPACING, type SpacingTokens } from '@constants/spacing';
import { FONT_SIZE, LINE_HEIGHT, FONT_WEIGHT, type TypographyTokens } from '@constants/typography';

export type Theme = {
  colors: ColorTokens;
  spacing: SpacingTokens;
  typography: TypographyTokens;
  isDark: boolean;
};

const lightTheme: Theme = {
  colors: LIGHT_COLORS,
  spacing: SPACING,
  typography: {
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    fontWeight: FONT_WEIGHT,
  },
  isDark: false,
};

const darkTheme: Theme = {
  colors: DARK_COLORS,
  spacing: SPACING,
  typography: {
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    fontWeight: FONT_WEIGHT,
  },
  isDark: true,
};

const ThemeContext = createContext<Theme>(lightTheme);

type ThemeProviderProps = Readonly<{
  children: React.ReactNode;
  forceDark?: boolean;
}>;

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, forceDark }) => {
  const colorScheme = useColorScheme();
  const isDark = forceDark !== undefined ? forceDark : colorScheme === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  return React.createElement(ThemeContext.Provider, { value: theme }, children);
};

export const useTheme = (): Theme => useContext(ThemeContext);
