import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import BuilderPage from './pages/BuilderPage';
import BakedForm from './pages/page1/Form_Итоговый_пример_c_элементами_для_реестра333333'
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="nav-menu">
          <Link to="/">Главная</Link>
          <Link to="/about">О нас</Link>
          <Link to="/contact">Контакты</Link>
          <Link to="/builder">Конструктор форм</Link>
          <Link to="/bakedform">Форма 1</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/builder" element={<BuilderPage />} />
          <Route path="/bakedform" element={<BakedForm />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;