import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme/colors';

export const AboutAppScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>О приложении</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text style={styles.title}>JoinMe</Text>
          <Text style={styles.version}>Версия 1.0.0</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Описание</Text>
          <Text style={styles.text}>
            JoinMe - это современное мобильное приложение для поиска и организации встреч и событий. 
            Приложение помогает людям находить единомышленников, планировать совместные активности 
            и расширять свой круг общения.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Основные возможности</Text>
          <View style={styles.featureItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.featureText}>Создание и участие в событиях различных форматов</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.featureText}>Фильтрация событий по городам</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.featureText}>Система заявок на участие в событиях</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.featureText}>Чат для участников каждого события</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.featureText}>Управление профилем с возможностью загрузки фото</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.featureText}>Push-уведомления о новых сообщениях и заявках</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.featureText}>Система блокировки пользователей</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Форматы событий</Text>
          <Text style={styles.text}>
            Приложение поддерживает различные форматы встреч: кофе, прогулки, обеды, ужины, 
            активности и другие виды совместного времяпрепровождения.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Безопасность</Text>
          <Text style={styles.text}>
            Мы заботимся о безопасности наших пользователей. В приложении реализована система 
            блокировки нежелательных пользователей, а также возможность управления списком 
            участников событий.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Разработка</Text>
          <Text style={styles.text}>
            JoinMe разработан с использованием современных технологий для обеспечения 
            быстрой работы и удобного пользовательского опыта.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    minWidth: 80,
  },
  backButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '500',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  version: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  text: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  bullet: {
    ...typography.body,
    color: colors.accent,
    marginRight: spacing.sm,
    fontSize: 20,
  },
  featureText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    lineHeight: 24,
  },
});

