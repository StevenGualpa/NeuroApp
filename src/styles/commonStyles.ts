import { StyleSheet } from 'react-native';
import { COLORS, LAYOUT } from '../constants';

export const commonStyles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  
  // Headers
  header: {
    backgroundColor: COLORS.BACKGROUND,
    paddingHorizontal: LAYOUT.SPACING.LG,
    paddingTop: LAYOUT.SPACING.SM,
    paddingBottom: LAYOUT.SPACING.SM,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Back Button
  backButton: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: LAYOUT.SPACING.LG,
    paddingVertical: LAYOUT.SPACING.SM + 2,
    borderRadius: LAYOUT.BORDER_RADIUS.MEDIUM,
    ...LAYOUT.SHADOW.SMALL,
    borderWidth: 1,
    borderColor: '#e8f0fe',
  },
  
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  
  // Scroll Views
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    paddingHorizontal: LAYOUT.SPACING.LG,
    paddingTop: LAYOUT.SPACING.SM,
  },
  
  // Instruction Cards
  instructionCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: LAYOUT.BORDER_RADIUS.MEDIUM,
    padding: LAYOUT.SPACING.LG,
    marginBottom: LAYOUT.SPACING.MD,
    ...LAYOUT.SHADOW.SMALL,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.PRIMARY,
  },
  
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: LAYOUT.SPACING.SM + 2,
  },
  
  instructionIcon: {
    fontSize: 20,
    marginRight: LAYOUT.SPACING.SM,
  },
  
  instructionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.DARK,
  },
  
  instructionText: {
    fontSize: 14,
    color: COLORS.DARK,
    fontWeight: '600',
    marginBottom: 6,
    paddingLeft: 6,
  },
  
  instructionTip: {
    backgroundColor: '#f0f9ff',
    borderRadius: LAYOUT.BORDER_RADIUS.SMALL + 2,
    padding: LAYOUT.SPACING.SM + 2,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  
  instructionTipText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Section Titles
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.DARK,
    marginBottom: LAYOUT.SPACING.MD,
    textAlign: 'center',
  },
  
  // Content Cards
  contentCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: LAYOUT.BORDER_RADIUS.MEDIUM,
    padding: LAYOUT.SPACING.LG,
    marginBottom: LAYOUT.SPACING.LG,
    ...LAYOUT.SHADOW.SMALL,
    borderLeftWidth: 3,
    borderLeftColor: '#ff9800',
  },
  
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: LAYOUT.SPACING.XL,
    paddingHorizontal: LAYOUT.SPACING.LG,
  },
  
  motivationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: LAYOUT.SPACING.XL,
    paddingVertical: LAYOUT.SPACING.MD,
    borderRadius: LAYOUT.SPACING.XL,
    ...LAYOUT.SHADOW.SMALL,
    marginBottom: LAYOUT.SPACING.MD,
  },
  
  motivationIcon: {
    fontSize: 18,
    marginHorizontal: 6,
  },
  
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.DARK,
    textAlign: 'center',
    flex: 1,
  },
  
  encouragementFooter: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: LAYOUT.SPACING.LG,
    paddingVertical: LAYOUT.SPACING.SM,
    borderRadius: LAYOUT.SPACING.LG,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  
  encouragementFooterText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Spacing
  bottomSpacing: {
    height: LAYOUT.SPACING.XL,
  },
  
  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  
  errorText: {
    fontSize: 64,
    marginBottom: LAYOUT.SPACING.LG,
  },
  
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.DARK,
    textAlign: 'center',
    marginBottom: LAYOUT.SPACING.SM,
  },
  
  errorMessage: {
    fontSize: 16,
    color: COLORS.GRAY,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Buttons
  primaryButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: LAYOUT.SPACING.XL,
    paddingVertical: LAYOUT.SPACING.MD,
    borderRadius: 25,
    alignItems: 'center',
    ...LAYOUT.SHADOW.MEDIUM,
  },
  
  primaryButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
  
  secondaryButton: {
    backgroundColor: COLORS.GRAY,
    paddingHorizontal: LAYOUT.SPACING.XL,
    paddingVertical: LAYOUT.SPACING.MD,
    borderRadius: 25,
    alignItems: 'center',
    ...LAYOUT.SHADOW.MEDIUM,
  },
  
  secondaryButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
});

// Utility function to merge styles
export const mergeStyles = (...styles: any[]) => {
  return StyleSheet.flatten(styles);
};

// Common style combinations
export const getCardStyle = (borderColor?: string) => ({
  ...commonStyles.contentCard,
  ...(borderColor && { borderLeftColor: borderColor }),
});

export const getButtonStyle = (type: 'primary' | 'secondary' = 'primary') => {
  return type === 'primary' ? commonStyles.primaryButton : commonStyles.secondaryButton;
};

export const getButtonTextStyle = (type: 'primary' | 'secondary' = 'primary') => {
  return type === 'primary' ? commonStyles.primaryButtonText : commonStyles.secondaryButtonText;
};