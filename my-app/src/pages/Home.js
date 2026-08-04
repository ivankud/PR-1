import React, { useMemo } from 'react';

const RANDOM_SENTENCES = [
  'Сегодня отличный день, чтобы создать что-то новое.',
  'Удача любит тех, кто действует.',
  'Каждая строка кода приближает вас к цели.',
  'Лучшие идеи рождаются внезапно.',
  'Не бойтесь экспериментировать — именно так рождается прогресс.',
  'Хороший интерфейс начинается с понимания пользователя.',
  'Маленькие шаги каждый день дают большие результаты.',
  'Ошибка — это просто ещё один способ научиться.',
];

function Home() {
  const randomSentence = useMemo(() => {
    const index = Math.floor(Math.random() * RANDOM_SENTENCES.length);
    return RANDOM_SENTENCES[index];
  }, []);

  return (
    <div className="page">
      <h1>Главная страница</h1>
      <p>Добро пожаловать на главную страницу приложения.</p>
      <p className="random-sentence">
        <em>{randomSentence}</em>
      </p>
    </div>
  );
}

export default Home;
