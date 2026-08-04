import { useState, useEffect, useCallback } from 'react';

/**
 * Хук для работы с localStorage с синхронизацией состояния.
 * @param {string} key - ключ в localStorage
 * @param {any} initialValue - начальное значение, если в localStorage ничего нет
 * @returns {[any, function]} - [значение, функция установки]
 */
export function useLocalStorage(key, initialValue) {
  // Инициализация состояния из localStorage
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error(`Ошибка чтения localStorage[${key}]:`, error);
    }
    return typeof initialValue === 'function' ? initialValue() : initialValue;
  });

  // Сохранение в localStorage при изменении значения
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Ошибка записи localStorage[${key}]:`, error);
    }
  }, [key, value]);

  // Функция для сброса к начальному значению
  const reset = useCallback(() => {
    setValue(typeof initialValue === 'function' ? initialValue() : initialValue);
  }, [initialValue]);

  return [value, setValue, reset];
}