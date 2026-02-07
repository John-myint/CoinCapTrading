export const formatPrice = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '$0.00';
  
  if (numValue >= 1000) {
    return `$${numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (numValue >= 1) {
    return `$${numValue.toFixed(2)}`;
  } else {
    return `$${numValue.toFixed(4)}`;
  }
};

export const formatChange = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '0.00%';
  
  const sign = numValue >= 0 ? '+' : '';
  return `${sign}${numValue.toFixed(2)}%`;
};

export const formatNumber = (value: number, decimals: number = 2): string => {
  if (isNaN(value)) return '0';
  return value.toLocaleString('en-US', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
};

export const formatCurrency = (value: number): string => {
  if (isNaN(value)) return '$0.00';
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatPercentage = (value: number): string => {
  if (isNaN(value)) return '0.00%';
  return `${value.toFixed(2)}%`;
};

export const truncateAddress = (address: string | null | undefined, startChars: number = 6, endChars: number = 4): string => {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};
