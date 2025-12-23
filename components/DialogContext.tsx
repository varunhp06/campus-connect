import React, { createContext, ReactNode, useContext, useState } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from './ThemeContext';

interface DialogButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface DialogOptions {
  title: string;
  message: string;
  buttons?: DialogButton[];
}

interface DialogContextType {
  showDialog: (options: DialogOptions) => void;
  hideDialog: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

interface DialogProviderProps {
  children: ReactNode;
}

export const DialogProvider: React.FC<DialogProviderProps> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [buttons, setButtons] = useState<DialogButton[]>([]);
  const { theme, isDarkMode } = useTheme();

  const showDialog = (options: DialogOptions) => {
    setTitle(options.title);
    setMessage(options.message);
    setButtons(options.buttons || [{ text: 'OK', style: 'default' }]);
    setIsVisible(true);
  };

  const hideDialog = () => {
    setIsVisible(false);
  };

  const handleButtonPress = (button: DialogButton) => {
    if (button.onPress) {
      button.onPress();
    }
    hideDialog();
  };

  const getButtonStyle = (buttonStyle?: string) => {
    switch (buttonStyle) {
      case 'destructive':
        return { color: '#EF4444', fontWeight: '700' as const };
      case 'cancel':
        return { color: theme.secondaryText || '#64748B', fontWeight: '600' as const };
      default:
        return { color: '#2563EB', fontWeight: '700' as const };
    }
  };

  return (
    <DialogContext.Provider value={{ showDialog, hideDialog }}>
      {children}
      <Modal
        transparent
        visible={isVisible}
        animationType="fade"
        onRequestClose={hideDialog}
      >
        <Pressable style={styles.overlay} onPress={hideDialog}>
          <Pressable style={styles.dialogContainer} onPress={(e) => e.stopPropagation()}>
            <View
              style={[
                styles.dialog,
                {
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                }
              ]}
            >
              {/* Title */}
              <View style={styles.header}>
                <Text
                  style={[
                    styles.title,
                    { color: theme.primaryText || (isDarkMode ? '#F1F5F9' : '#0F172A') }
                  ]}
                >
                  {title}
                </Text>
              </View>

              {/* Message */}
              <View style={styles.content}>
                <Text
                  style={[
                    styles.message,
                    { color: theme.secondaryText || (isDarkMode ? '#94A3B8' : '#64748B') }
                  ]}
                >
                  {message}
                </Text>
              </View>

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                {buttons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      index < buttons.length - 1 && styles.buttonBorder,
                      { borderTopColor: isDarkMode ? '#334155' : '#E2E8F0' }
                    ]}
                    onPress={() => handleButtonPress(button)}
                  >
                    <Text style={[styles.buttonText, getButtonStyle(button.style)]}>
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </DialogContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    width: '85%',
    maxWidth: 400,
  },
  dialog: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  buttonContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  button: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonBorder: {
    borderBottomWidth: 1,
  },
  buttonText: {
    fontSize: 16,
  },
});
