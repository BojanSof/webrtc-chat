import { useContext } from 'react';
import ThemeContext from '../context/ThemeContext';

const useTheme = () => useContext(ThemeContext);

export default useTheme;
