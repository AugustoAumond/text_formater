import { useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import {
  RuleFields,
  type EditableReplacementRule,
} from './components/RuleFields'
import {
  normalizeIdentifier,
  transformTextWithPreview,
  type TransformPreview,
} from './utils/transformText'

type RuleField = 'from' | 'to'
type CopyStatus = 'idle' | 'success' | 'error'

const firstRule: EditableReplacementRule = { id: 1, from: '', to: '' }

function getValidationError(rules: EditableReplacementRule[]): string | null {
  const sources = new Set<string>()

  for (const rule of rules) {
    if (!rule.from || !rule.to) {
      return 'Preencha os campos De e Para de todas as regras.'
    }

    const normalizedSource = normalizeIdentifier(rule.from)

    if (sources.has(normalizedSource)) {
      return 'Existem valores duplicados no campo De. Cada regra deve ter um valor único.'
    }

    sources.add(normalizedSource)
  }

  return null
}

function App() {
  const [rules, setRules] = useState<EditableReplacementRule[]>([firstRule])
  const [nextRuleId, setNextRuleId] = useState(2)
  const [inputText, setInputText] = useState('')
  const [result, setResult] = useState<TransformPreview | null>(null)
  const [error, setError] = useState('')
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')

  function addRule() {
    setRules((currentRules) => [
      ...currentRules,
      { id: nextRuleId, from: '', to: '' },
    ])
    setNextRuleId((currentId) => currentId + 1)
    setResult(null)
    setCopyStatus('idle')
  }

  function updateRule(id: number, field: RuleField, value: string) {
    setRules((currentRules) =>
      currentRules.map((rule) =>
        rule.id === id ? { ...rule, [field]: value } : rule,
      ),
    )
    setResult(null)
    setCopyStatus('idle')
  }

  function removeRule(id: number) {
    setRules((currentRules) =>
      currentRules.length === 1
        ? currentRules
        : currentRules.filter((rule) => rule.id !== id),
    )
    setResult(null)
    setCopyStatus('idle')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationError = getValidationError(rules)
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setResult(transformTextWithPreview(inputText, rules))
    setCopyStatus('idle')
  }

  async function copyResult() {
    if (result === null) {
      return
    }

    try {
      await navigator.clipboard.writeText(result.text)
      setCopyStatus('success')
    } catch {
      setCopyStatus('error')
    }
  }

  return (
    <main className="app-shell">
      <section className="app-container" aria-labelledby="page-title">
        <header className="intro">
          <span className="eyebrow">Substituição em lote</span>
          <h1 id="page-title">Formatador de identificadores</h1>
          <p>
            Crie regras de <strong>De → Para</strong> e atualize os
            identificadores do texto em uma única passagem.
          </p>
        </header>

        <form className="formatter-card" onSubmit={handleSubmit}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Regras</span>
              <h2>De → Para</h2>
            </div>
            <span className="rule-count">{rules.length} regra{rules.length === 1 ? '' : 's'}</span>
          </div>

          <div className="rules-list">
            {rules.map((rule, index) => (
              <RuleFields
                key={rule.id}
                rule={rule}
                index={index}
                canRemove={rules.length > 1}
                onChange={updateRule}
                onRemove={removeRule}
              />
            ))}
          </div>

          <button className="add-rule-button" type="button" onClick={addRule}>
            + Adicionar De → Para
          </button>

          <p className="helper-text">
            Apenas identificadores de entrada como <code>#1</code> são alterados.
            Valores já finalizados, como <code>#1#</code>, permanecem intactos.
            Zeros à esquerda também são reconhecidos: <code>#03</code> corresponde
            à regra <code>3</code>.
            Se uma tag estiver sozinha em uma linha, ela e o texto seguinte formam
            uma seção que será reordenada pelo número final.
          </p>

          <div className="text-field">
            <label htmlFor="input-text">Texto de entrada</label>
            <textarea
              id="input-text"
              value={inputText}
              onChange={(event) => {
                setInputText(event.target.value)
                setResult(null)
                setCopyStatus('idle')
              }}
              placeholder="Cole ou escreva o texto que deseja transformar..."
              rows={10}
            />
          </div>

          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}

          <button className="transform-button" type="submit">
            Aplicar alterações
          </button>
        </form>

        <section className="result-card" aria-labelledby="result-title" aria-live="polite">
          <div className="result-heading">
            <div>
              <span className="eyebrow">Saída</span>
              <h2 id="result-title">Texto resultante</h2>
            </div>
            {result !== null && (
              <div className="result-actions">
                <span className="status">Processado</span>
                <button
                  className="copy-button"
                  type="button"
                  onClick={copyResult}
                  aria-label="Copiar texto resultante"
                  title="Copiar texto resultante"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 8.25V5.5A1.5 1.5 0 0 1 10.5 4h7A1.5 1.5 0 0 1 19 5.5v9a1.5 1.5 0 0 1-1.5 1.5H15" />
                    <rect x="5" y="8.5" width="10" height="11.5" rx="1.5" />
                  </svg>
                  <span className="sr-only">Copiar texto resultante</span>
                </button>
                {copyStatus === 'success' && (
                  <span className="copy-feedback" role="status">Copiado</span>
                )}
                {copyStatus === 'error' && (
                  <span className="copy-feedback is-error" role="alert">
                    Não foi possível copiar
                  </span>
                )}
              </div>
            )}
          </div>

          <pre className={result === null ? 'result-content is-empty' : 'result-content'}>
            {result === null
              ? 'O texto transformado aparecerá aqui.'
              : result.text
                ? result.parts.map((part, index) =>
                    part.appliedRule ? (
                      <span
                        className="changed-identifier"
                        key={index}
                        tabIndex={0}
                      >
                        {part.text}
                        <span className="rule-tooltip" role="tooltip">
                          Regra aplicada: #{part.appliedRule.from} → #
                          {part.appliedRule.to}#
                        </span>
                      </span>
                    ) : (
                      part.text
                    ),
                  )
                : 'O texto resultante está vazio.'}
          </pre>
        </section>
      </section>
    </main>
  )
}

export default App
