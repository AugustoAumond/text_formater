import type { ReplacementRule } from '../utils/transformText'

export type EditableReplacementRule = ReplacementRule & {
  id: number
}

type RuleField = keyof ReplacementRule

type RuleFieldsProps = {
  rule: EditableReplacementRule
  index: number
  canRemove: boolean
  onChange: (id: number, field: RuleField, value: string) => void
  onRemove: (id: number) => void
}

export function RuleFields({
  rule,
  index,
  canRemove,
  onChange,
  onRemove,
}: RuleFieldsProps) {
  const ruleNumber = index + 1

  return (
    <div className="rule-row">
      <span className="rule-index" aria-hidden="true">
        {String(ruleNumber).padStart(2, '0')}
      </span>

      <div className="rule-inputs">
        <div className="rule-field">
          <label htmlFor={'from-' + rule.id}>De</label>
          <div className="number-input">
            <span aria-hidden="true">#</span>
            <input
              id={'from-' + rule.id}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={rule.from}
              onChange={(event) =>
                onChange(rule.id, 'from', event.target.value.replace(/\D/g, ''))
              }
              placeholder="Ex.: 1"
            />
          </div>
        </div>

        <span className="arrow" aria-hidden="true">
          →
        </span>

        <div className="rule-field">
          <label htmlFor={'to-' + rule.id}>Para</label>
          <div className="number-input">
            <span aria-hidden="true">#</span>
            <input
              id={'to-' + rule.id}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={rule.to}
              onChange={(event) =>
                onChange(rule.id, 'to', event.target.value.replace(/\D/g, ''))
              }
              placeholder="Ex.: 12"
            />
            <span aria-hidden="true">#</span>
          </div>
        </div>
      </div>

      {canRemove && (
        <button
          className="remove-rule-button"
          type="button"
          onClick={() => onRemove(rule.id)}
          aria-label={'Remover regra ' + ruleNumber}
        >
          Remover
        </button>
      )}
    </div>
  )
}
