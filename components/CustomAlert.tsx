import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import HapticPressable from './HapticPressable';
import { useTheme } from './ThemeContext';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  onClose: () => void;
  onConfirm: () => void;
  cancelText?: string;
  confirmText?: string;
  confirmButtonColor?: string; 
}

const CustomAlert: React.FC<CustomAlertProps> = ({ 
  visible, 
  title, 
  message, 
  onClose, 
  onConfirm,
  cancelText = 'Cancel',
  confirmText = 'Okay',
  confirmButtonColor = '#007AFF' 
}) => {
  const { theme } = useTheme();

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true} 
    >
      <View style={styles.overlay}>
        <View style={[
          styles.alertBox, 
          { 
            backgroundColor: theme.inputBackground,
            borderColor: theme.inputBorder,
            borderWidth: 1
          }
        ]}>
          <Text style={[styles.title, { color: theme.text }]}>
            {title}
          </Text>

          {message && (
            <Text style={[styles.message, { color: theme.primaryText }]}>
              {message}
            </Text>
          )}

          <View style={styles.buttonContainer}>
            <HapticPressable 
              style={[
                styles.cancelButton, 
                { backgroundColor: theme.inputBorder } 
              ]} 
              onPress={onClose}
            >
              <Text style={[styles.cancelText, { color: theme.text }]}>
                {cancelText}
              </Text>
            </HapticPressable>
            
            <HapticPressable 
              style={[
                styles.confirmButton, 
                { backgroundColor: confirmButtonColor } 
              ]} 
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>
                {confirmText}
              </Text>
            </HapticPressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
  },
  alertBox: {
    width: 350,
    borderRadius: 15,
    padding: 35,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontWeight: '600',
  },
  confirmText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default CustomAlert;