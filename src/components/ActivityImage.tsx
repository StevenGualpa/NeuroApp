import React, { useState } from 'react';
import { Image, View, Text, StyleSheet, ImageStyle, ViewStyle } from 'react-native';

interface ActivityImageProps {
  imageUrl?: string;
  fallbackEmoji?: string;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
}

const ActivityImage: React.FC<ActivityImageProps> = ({
  imageUrl,
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
    let dimensions;
    switch (size) {
      case 'small':
        dimensions = { width: 50, height: 50 };
        break;
      case 'medium':
        dimensions = { width: 220, height: 220 };
        break;
      case 'large':
        dimensions = { width: 260, height: 260 };
        break;
      default:
        dimensions = { width: 220, height: 220 };
    }
    
    console.log(`📐 [ActivityImage] Tamaño aplicado: ${size} -> ${dimensions.width}x${dimensions.height}px`);
    return dimensions;
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
      <View style={[styles.container, containerStyle]}>
        <Text style={[styles.fallbackEmoji, { fontSize: sizeStyle.width * 0.6 }]}>
          {fallbackEmoji}
        </Text>
      </View>
    );
  }

  // Si hay error, mostrar emoji
  if (imageError) {
    return (
      <View style={[styles.container, containerStyle]}>
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
    borderRadius: 25,
  },
  fallbackContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 60,
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
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ActivityImage;