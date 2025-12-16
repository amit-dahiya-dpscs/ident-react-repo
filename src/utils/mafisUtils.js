const numericToDisplayMap = {
    '1': 'A', '2': 'W', '3': '\\', '4': '/', '5': 'X', '9': 'U', '0': 'U'
};

export const convertMafisHandToDisplay = (numericHand) => {
    if (!numericHand || typeof numericHand !== 'string') return '--';
    let displayValue = '';
    for (const char of numericHand) {
        displayValue += numericToDisplayMap[char] || '';
    }
    return displayValue.trim() || '--';
};