export type AiEvalCase = {
  id: string
  message: string
  expectedIntent: string
  expectedLanguage: string
  mustNotContain?: string[]
}

export const TUNISIAN_AI_EVALS: AiEvalCase[] = [
  {
    id: 'tn-order-start',
    message: 'nheb ncommandi',
    expectedIntent: 'order_start',
    expectedLanguage: 'tn_arabizi',
  },
  {
    id: 'tn-delivery-zone',
    message: 'fama livraison l Ariana?',
    expectedIntent: 'delivery_inquiry',
    expectedLanguage: 'tn_arabizi',
  },
  {
    id: 'tn-price',
    message: '9adeh soumha?',
    expectedIntent: 'price_inquiry',
    expectedLanguage: 'tn_arabizi',
    mustNotContain: ['prix non renseigne invente'],
  },
  {
    id: 'tn-size',
    message: 'mawjoud taille L?',
    expectedIntent: 'size_inquiry',
    expectedLanguage: 'tn_arabizi',
  },
  {
    id: 'tn-human-handoff',
    message: 'nheb neklem wehed mel equipe',
    expectedIntent: 'human_request',
    expectedLanguage: 'tn_arabizi',
  },
]
