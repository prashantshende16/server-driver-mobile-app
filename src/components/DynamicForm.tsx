import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { MobileAPI } from '../config/api';

interface DynamicFormProps {
  formSlug?: string;
  formConfig?: any;
  onSubmitSuccess?: () => void;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  formSlug,
  formConfig: initialConfig,
  onSubmitSuccess,
}) => {
  const [formConfig, setFormConfig] = useState<any>(initialConfig || null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(!initialConfig && !!formSlug);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!initialConfig && formSlug) {
      MobileAPI.getForm(formSlug)
        .then((data) => {
          setFormConfig(data);
          const initial: Record<string, any> = {};
          data.fields?.forEach((f: any) => {
            initial[f.name] = f.default_value ?? (f.type === 'boolean' ? false : '');
          });
          setFormData(initial);
        })
        .catch((err) => {
          console.error('[FlowForge Form] Error fetching form:', err);
        })
        .finally(() => setLoading(false));
    } else if (initialConfig) {
      const initial: Record<string, any> = {};
      initialConfig.fields?.forEach((f: any) => {
        initial[f.name] = f.default_value ?? (f.type === 'boolean' ? false : '');
      });
      setFormData(initial);
    }
  }, [formSlug, initialConfig]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#2563eb" />
        <Text style={styles.loadingText}>Loading form...</Text>
      </View>
    );
  }

  if (!formConfig) {
    return null;
  }

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    for (const field of formConfig.fields || []) {
      if (field.required && (formData[field.name] === undefined || formData[field.name] === '')) {
        Alert.alert('Required Field', `Please fill in ${field.label || field.name}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const submitAction = formConfig.submit || formConfig.submit_action || {};
      const endpoint = submitAction.endpoint || '/api/v1/submit';
      const method = submitAction.method || 'POST';

      await MobileAPI.submitAction(endpoint, method, formData);

      Alert.alert('Success', formConfig.success_message || 'Form submitted successfully!');
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (e: any) {
      console.error('[FlowForge Form] Submission error:', e);
      Alert.alert(
        'Submission Failed',
        e.response?.data?.message || formConfig.failure_message || 'Could not submit form.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.formWrapper}>
      {formConfig.title && <Text style={styles.formTitle}>{formConfig.title}</Text>}
      {formConfig.description && <Text style={styles.formDescription}>{formConfig.description}</Text>}

      <View style={styles.fieldsContainer}>
        {formConfig.fields?.map((field: any, idx: number) => {
          const isRequired = field.required;

          if (field.type === 'boolean') {
            return (
              <View key={idx} style={styles.switchRow}>
                <Text style={styles.label}>
                  {field.label || field.name}
                  {isRequired && <Text style={styles.requiredStar}> *</Text>}
                </Text>
                <Switch
                  value={!!formData[field.name]}
                  onValueChange={(val) => handleInputChange(field.name, val)}
                  trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                  thumbColor={formData[field.name] ? '#2563eb' : '#f3f4f6'}
                />
              </View>
            );
          }

          if (field.type === 'textarea') {
            return (
              <View key={idx} style={styles.fieldGroup}>
                <Text style={styles.label}>
                  {field.label || field.name}
                  {isRequired && <Text style={styles.requiredStar}> *</Text>}
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  numberOfLines={4}
                  placeholder={field.placeholder || `Enter ${field.label || field.name}...`}
                  placeholderTextColor="#9ca3af"
                  value={formData[field.name]?.toString() || ''}
                  onChangeText={(val) => handleInputChange(field.name, val)}
                />
              </View>
            );
          }

          if (field.type === 'select' && Array.isArray(field.options) && field.options.length > 0) {
            return (
              <View key={idx} style={styles.fieldGroup}>
                <Text style={styles.label}>
                  {field.label || field.name}
                  {isRequired && <Text style={styles.requiredStar}> *</Text>}
                </Text>
                <View style={styles.optionsRow}>
                  {field.options.map((opt: string, optIdx: number) => {
                    const isSelected = formData[field.name] === opt;
                    return (
                      <TouchableOpacity
                        key={optIdx}
                        style={[styles.optionChip, isSelected && styles.optionChipSelected]}
                        onPress={() => handleInputChange(field.name, opt)}
                      >
                        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          }

          const keyboardType =
            field.type === 'number'
              ? 'numeric'
              : field.type === 'email'
              ? 'email-address'
              : field.type === 'phone'
              ? 'phone-pad'
              : 'default';

          return (
            <View key={idx} style={styles.fieldGroup}>
              <Text style={styles.label}>
                {field.label || field.name}
                {isRequired && <Text style={styles.requiredStar}> *</Text>}
              </Text>
              <TextInput
                style={styles.input}
                keyboardType={keyboardType}
                placeholder={field.placeholder || `Enter ${field.label || field.name}...`}
                placeholderTextColor="#9ca3af"
                value={formData[field.name]?.toString() || ''}
                onChangeText={(val) => handleInputChange(field.name, val)}
              />
            </View>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Text style={styles.submitButtonText}>Submit</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  formWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  formDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  fieldsContainer: {
    gap: 14,
    marginBottom: 20,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  requiredStar: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  optionChipSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  optionText: {
    fontSize: 13,
    color: '#4b5563',
  },
  optionTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
});
