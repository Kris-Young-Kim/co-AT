export interface YearEndTaxInput {
  grossIncome: number
  dependentsCount: number
  elderlyCount: number
  disabledCount: number
  medicalExpenses: number
  educationExpenses: number
  housingRent: number
  prepaidIncomeTax: number
  prepaidLocalTax: number
}

export interface YearEndTaxResult {
  earnedIncomeDeduction: number
  personalDeduction: number
  taxableIncome: number
  calculatedIncomeTax: number
  earnedIncomeTaxCredit: number
  specialTaxCredit: number
  finalIncomeTax: number
  finalLocalTax: number
  refundIncomeTax: number
  refundLocalTax: number
}

/** 근로소득공제 (2024 기준) */
function calcEarnedIncomeDeduction(gross: number): number {
  if (gross <= 5_000_000)          return Math.round(gross * 0.70)
  if (gross <= 15_000_000)         return Math.round(3_500_000 + (gross - 5_000_000) * 0.40)
  if (gross <= 45_000_000)         return Math.round(7_500_000 + (gross - 15_000_000) * 0.15)
  if (gross <= 100_000_000)        return Math.round(12_000_000 + (gross - 45_000_000) * 0.05)
  return 20_000_000
}

/** 인적공제 합계 */
function calcPersonalDeduction(
  dependentsCount: number,
  elderlyCount: number,
  disabledCount: number
): number {
  const basic = (1 + dependentsCount) * 1_500_000      // 본인 + 부양가족
  const elderly = elderlyCount * 1_000_000              // 경로우대 추가공제
  const disabled = disabledCount * 2_000_000            // 장애인 추가공제
  return basic + elderly + disabled
}

/** 소득세 산출세액 (2024 기준 세율구간) */
function calcIncomeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0
  if (taxableIncome <= 14_000_000)   return Math.round(taxableIncome * 0.06)
  if (taxableIncome <= 50_000_000)   return Math.round(840_000       + (taxableIncome - 14_000_000) * 0.15)
  if (taxableIncome <= 88_000_000)   return Math.round(6_240_000     + (taxableIncome - 50_000_000) * 0.24)
  if (taxableIncome <= 150_000_000)  return Math.round(15_360_000    + (taxableIncome - 88_000_000) * 0.35)
  if (taxableIncome <= 300_000_000)  return Math.round(37_060_000    + (taxableIncome - 150_000_000) * 0.38)
  if (taxableIncome <= 500_000_000)  return Math.round(94_060_000    + (taxableIncome - 300_000_000) * 0.40)
  if (taxableIncome <= 1_000_000_000) return Math.round(174_060_000  + (taxableIncome - 500_000_000) * 0.42)
  return Math.round(384_060_000 + (taxableIncome - 1_000_000_000) * 0.45)
}

/** 근로소득세액공제 */
function calcEarnedIncomeTaxCredit(calculatedTax: number, grossIncome: number): number {
  let credit: number
  if (calculatedTax <= 1_300_000) {
    credit = Math.round(calculatedTax * 0.55)
  } else {
    credit = Math.round(715_000 + (calculatedTax - 1_300_000) * 0.30)
  }
  const ceiling = grossIncome <= 55_000_000 ? 740_000 : 660_000
  return Math.min(credit, ceiling)
}

/** 특별세액공제 합계 */
function calcSpecialTaxCredit(
  grossIncome: number,
  medicalExpenses: number,
  educationExpenses: number,
  housingRent: number
): number {
  // 의료비 공제: 총급여 3% 초과분의 15%, 한도 700만
  const medicalBase = Math.max(0, medicalExpenses - Math.round(grossIncome * 0.03))
  const medicalCredit = Math.round(Math.min(medicalBase, 7_000_000) * 0.15)

  // 교육비 공제: 15% (부양가족 1인당 한도 300만)
  const eduCredit = Math.round(Math.min(educationExpenses, 3_000_000) * 0.15)

  // 월세 공제: 15% (한도 750만, 총급여 5,500만 이하)
  let rentCredit = 0
  if (grossIncome <= 55_000_000) {
    rentCredit = Math.round(Math.min(housingRent, 7_500_000) * 0.15)
  }

  return medicalCredit + eduCredit + rentCredit
}

export function calcYearEndTax(input: YearEndTaxInput): YearEndTaxResult {
  const {
    grossIncome, dependentsCount, elderlyCount, disabledCount,
    medicalExpenses, educationExpenses, housingRent,
    prepaidIncomeTax, prepaidLocalTax,
  } = input

  const earnedIncomeDeduction = calcEarnedIncomeDeduction(grossIncome)
  const personalDeduction = calcPersonalDeduction(dependentsCount, elderlyCount, disabledCount)
  const taxableIncome = Math.max(0, grossIncome - earnedIncomeDeduction - personalDeduction)

  const calculatedIncomeTax = calcIncomeTax(taxableIncome)
  const earnedIncomeTaxCredit = calcEarnedIncomeTaxCredit(calculatedIncomeTax, grossIncome)
  const specialTaxCredit = calcSpecialTaxCredit(grossIncome, medicalExpenses, educationExpenses, housingRent)

  const finalIncomeTax = Math.max(0, calculatedIncomeTax - earnedIncomeTaxCredit - specialTaxCredit)
  const finalLocalTax = Math.round(finalIncomeTax * 0.1)

  const refundIncomeTax = prepaidIncomeTax - finalIncomeTax
  const refundLocalTax = prepaidLocalTax - finalLocalTax

  return {
    earnedIncomeDeduction,
    personalDeduction,
    taxableIncome,
    calculatedIncomeTax,
    earnedIncomeTaxCredit,
    specialTaxCredit,
    finalIncomeTax,
    finalLocalTax,
    refundIncomeTax,
    refundLocalTax,
  }
}
