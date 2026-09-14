const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertBelowThousand(num: number): string {
  let str = '';
  if (num >= 100) {
    str += ONES[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  if (num >= 20) {
    str += TENS[Math.floor(num / 10)] + (num % 10 ? ' ' + ONES[num % 10] : '');
  } else if (num > 0) {
    str += ONES[num];
  }
  return str.trim();
}

/**
 * Converts a number to Indian Rupee Words (Lakh, Crore system)
 * e.g. 1240 -> "One Thousand Two Hundred and Forty Rupees only"
 */
export function numberToIndianRupees(amount: number): string {
  if (!amount || isNaN(amount) || amount === 0) {
    return 'Zero Rupees only';
  }

  let num = Math.floor(Math.abs(amount));
  let result = '';

  // Crores
  if (num >= 10000000) {
    const crores = Math.floor(num / 10000000);
    result += convertBelowThousand(crores) + ' Crore ';
    num %= 10000000;
  }

  // Lakhs
  if (num >= 100000) {
    const lakhs = Math.floor(num / 100000);
    result += convertBelowThousand(lakhs) + ' Lakh ';
    num %= 100000;
  }

  // Thousands
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    result += convertBelowThousand(thousands) + ' Thousand ';
    num %= 1000;
  }

  // Remaining below 1000
  if (num > 0) {
    result += convertBelowThousand(num);
  }

  return `${result.trim()} Rupees only`;
}
