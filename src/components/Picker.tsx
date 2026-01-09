import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { colors, spacing, typography } from '../theme/colors';

interface PickerProps {
  label?: string;
  value: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export const Picker: React.FC<PickerProps> = ({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Выберите...',
  error,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectedOption = options.find(opt => opt.value === value);
  const isCityPicker = label === 'Город';

  // Фильтруем опции после ввода 3-х букв
  const filteredOptions = useMemo(() => {
    if (!isCityPicker || searchQuery.length < 3) {
      return options;
    }
    const query = searchQuery.toLowerCase();
    return options.filter(option => 
      option.label.toLowerCase().includes(query)
    );
  }, [options, searchQuery, isCityPicker]);

  const handleOpenModal = () => {
    setModalVisible(true);
    setSearchQuery(''); // Сбрасываем поиск при открытии
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSearchQuery(''); // Сбрасываем поиск при закрытии
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, error && styles.labelError]}>
          {label} {error && `• ${error}`}
        </Text>
      )}
      <TouchableOpacity
        style={[styles.picker, error && styles.pickerError]}
        onPress={handleOpenModal}
        activeOpacity={0.7}
      >
        <Text style={[styles.pickerText, !selectedOption && styles.placeholder]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Выберите'}</Text>
              <TouchableOpacity
                onPress={handleCloseModal}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            {isCityPicker && (
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Поиск города (минимум 3 буквы)..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}
            <FlatList
              data={filteredOptions}
              keyExtractor={item => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    value === item.value && styles.optionSelected,
                  ]}
                  onPress={() => {
                    onSelect(item.value);
                    handleCloseModal();
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      value === item.value && styles.optionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {value === item.value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                isCityPicker && searchQuery.length >= 3 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Город не найден</Text>
                  </View>
                ) : null
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  labelError: {
    color: colors.error,
  },
  picker: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
  },
  pickerError: {
    borderColor: colors.error,
  },
  pickerText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  placeholder: {
    color: colors.textLight,
  },
  arrow: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    maxHeight: '70%',
    width: '100%',
    height: 340,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  closeButton: {
    padding: spacing.xs,
  },
  closeButtonText: {
    ...typography.h3,
    color: colors.textSecondary,
  },
  option: {
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  optionSelected: {
    backgroundColor: colors.accentLight + '20',
  },
  optionText: {
    ...typography.body,
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.accent,
    fontWeight: '500',
  },
  checkmark: {
    ...typography.body,
    color: colors.accent,
    fontWeight: '600',
  },
  searchContainer: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  searchInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.text,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});

