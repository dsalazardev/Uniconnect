import { Platform, Alert } from 'react-native';

const webToast = (message: string, type: 'success' | 'error' | 'info') => {
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6',
  };

  const toastElement = document.createElement('div');
  toastElement.textContent = message;
  toastElement.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type]};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 9999;
    font-size: 14px;
    font-weight: 500;
    animation: slideIn 0.3s ease-out;
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(toastElement);

  setTimeout(() => {
    toastElement.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => toastElement.remove(), 300);
  }, 3000);
};

export const showToast = {
  success: (title: string, message?: string) => {
    const msg = message ? `${title}: ${message}` : title;
    
    if (Platform.OS === 'web') {
      webToast(msg, 'success');
    } else {
      Alert.alert(title, message);
    }
  },

  error: (title: string, message?: string) => {
    const msg = message ? `${title}: ${message}` : title;
    
    if (Platform.OS === 'web') {
      webToast(msg, 'error');
    } else {
      Alert.alert(title, message);
    }
  },

  info: (title: string, message?: string) => {
    const msg = message ? `${title}: ${message}` : title;
    
    if (Platform.OS === 'web') {
      webToast(msg, 'info');
    } else {
      Alert.alert(title, message);
    }
  },
};