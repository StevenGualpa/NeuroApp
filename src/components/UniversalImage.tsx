import React, { useState } from 'react';
import { Image, View, Text, StyleSheet, ImageStyle, ViewStyle } from 'react-native';

interface UniversalImageProps {
  imageUrl?: string;
  imageType?: 'actividades' | 'categorias' | 'lecciones' | 'pasos' | 'opciones' | 'logros';
  fallbackEmoji?: string;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
}

const UniversalImage: React.FC<UniversalImageProps> = ({
  imageUrl,
  imageType = 'actividades',
  fallbackEmoji = '🎮',
  style,
  containerStyle,
  size = 'medium'
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  // Las URLs del servidor ya vienen corregidas, usar directamente
  const getCorrectImageUrl = (originalUrl?: string) => {
    if (!originalUrl) return null;
    
    // Usar la URL tal como viene del servidor
    return originalUrl;
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { width: 40, height: 40 };
      case 'medium':
        return { width: 50, height: 50 };
      case 'large':
        return { width: 70, height: 70 };
      default:
        return { width: 50, height: 50 };
    }
  };

  const sizeStyle = getSizeStyle();
  const correctUrl = getCorrectImageUrl(imageUrl);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageLoadStart = () => {
    setImageLoading(true);
  };

  // Si no hay URL, mostrar emoji directamente
  if (!correctUrl) {
    return (
      <View style={[styles.container, styles.fallbackContainer, sizeStyle, containerStyle]}>
        <Text style={[styles.fallbackEmoji, { fontSize: sizeStyle.width * 0.6 }]}>
          {fallbackEmoji}
        </Text>
      </View>
    );
  }

  // Si hay error, mostrar emoji
  if (imageError) {
    return (
      <View style={[styles.container, styles.fallbackContainer, sizeStyle, containerStyle]}>
        <Text style={[styles.fallbackEmoji, { fontSize: sizeStyle.width * 0.6 }]}>
          {fallbackEmoji}
        </Text>
      </View>
    );
  }

  // Cargar imagen del servidor
  return (
    <View style={[styles.container, containerStyle]}>
      <Image
        source={{ uri: correctUrl }}
        style={[styles.image, sizeStyle, style]}
        resizeMode="contain"
        onError={handleImageError}
        onLoad={handleImageLoad}
        onLoadStart={handleImageLoadStart}
      />
      {imageLoading && (
        <View style={[styles.loadingOverlay, sizeStyle]}>
          <Text style={[styles.loadingEmoji, { fontSize: sizeStyle.width * 0.4 }]}>
            ⏳
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    borderRadius: 8,
  },
  fallbackContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackEmoji: {
    textAlign: 'center',
  },
  loadingEmoji: {
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default UniversalImage;