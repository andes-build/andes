// @vitest-environment happy-dom

import type { ReactNode } from 'react'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { i18n, translate } from '@/i18n/i18n'
import { getAgentAwakeModeLabel, getAgentAwakeTitle } from '../settings/agent-awake-copy'
import { CaffeinateStatusSegment } from './CaffeinateStatusSegment'

const storeMocks = vi.hoisted(() => ({
  settings: {
    computerAwakeMode: 'off',
    keepComputerAwakeWhileAgentsRun: false
  },
  updateSettings: vi.fn()
}))

const awakeMocks = vi.hoisted(() => ({
  status: { mode: 'off', active: false },
  unsubscribe: vi.fn()
}))

vi.mock('@/store', () => ({
  useAppStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({ settings: storeMocks.settings, updateSettings: storeMocks.updateSettings })
}))

vi.mock('@/lib/desktop-window-chrome', () => ({
  isPairedWebClientWindow: () => false
}))

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: ReactNode }) => <div role="tooltip">{children}</div>
}))

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <>{children}</>,
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div role="menu">{children}</div>,
  DropdownMenuLabel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuRadioGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuRadioItem: ({ children }: { children: ReactNode }) => (
    <div role="menuitemradio" aria-checked="false">
      {children}
    </div>
  ),
  DropdownMenuSeparator: () => <hr />
}))

// Why: English is the only shipped catalog (specs/done/008-un-solo-idioma.md), so
// a synthetic resource bundle stands in for a real second-locale catalog here —
// this file's whole point is proving these strings come from translate() calls,
// not a hardcoded English literal.
const SYNTHETIC_LOCALE = 'zz'
const SYNTHETIC_COPY = {
  title: 'Mantener la computadora activa',
  on: 'Activado',
  auto: 'Agente',
  off: 'Desactivado',
  active: 'Activo',
  inactive: 'Inactivo',
  ariaLabel: 'Mantener la computadora activa, Desactivado · Inactivo',
  onDescription: 'Mantener esta computadora activa en todo momento',
  autoDescription: 'Mantener la computadora activa mientras un agente está trabajando',
  offDescription: 'Permitir que el sistema entre en suspensión normalmente'
} as const

function registerSyntheticBundle(): void {
  i18n.addResourceBundle(
    SYNTHETIC_LOCALE,
    'translation',
    {
      auto: {
        components: {
          settings: {
            'agent-awake-copy': { modeTitle: SYNTHETIC_COPY.title },
            AgentAwakeSetting: {
              on: SYNTHETIC_COPY.on,
              auto: SYNTHETIC_COPY.auto,
              off: SYNTHETIC_COPY.off
            }
          },
          status: {
            bar: {
              CaffeinateStatusSegment: {
                active: SYNTHETIC_COPY.active,
                inactive: SYNTHETIC_COPY.inactive,
                ariaLabel: '{{title}}, {{status}}',
                onDescription: SYNTHETIC_COPY.onDescription,
                autoDescription: SYNTHETIC_COPY.autoDescription,
                offDescription: SYNTHETIC_COPY.offDescription
              }
            }
          }
        }
      }
    },
    true,
    true
  )
}

let previousLanguage: string

beforeAll(() => {
  previousLanguage = i18n.language
  registerSyntheticBundle()
})

beforeEach(() => {
  storeMocks.settings = {
    computerAwakeMode: 'off',
    keepComputerAwakeWhileAgentsRun: false
  }
  awakeMocks.status = { mode: 'off', active: false }
  storeMocks.updateSettings.mockClear()
  awakeMocks.unsubscribe.mockClear()
  Object.defineProperty(window, 'api', {
    configurable: true,
    value: {
      agentAwake: {
        getStatus: vi.fn().mockImplementation(() => Promise.resolve(awakeMocks.status)),
        onChanged: vi.fn().mockReturnValue(awakeMocks.unsubscribe)
      }
    }
  })
})

afterEach(cleanup)

afterAll(async () => {
  await i18n.changeLanguage(previousLanguage)
})

describe('keep-awake copy under a non-English UI language', () => {
  it('resolves the shared title, modes, and activity', async () => {
    await i18n.changeLanguage(SYNTHETIC_LOCALE)

    expect({
      title: getAgentAwakeTitle(),
      on: getAgentAwakeModeLabel('on'),
      auto: getAgentAwakeModeLabel('auto'),
      off: getAgentAwakeModeLabel('off'),
      active: translate('auto.components.status.bar.CaffeinateStatusSegment.active', 'Active'),
      inactive: translate(
        'auto.components.status.bar.CaffeinateStatusSegment.inactive',
        'Inactive'
      ),
      ariaLabel: translate(
        'auto.components.status.bar.CaffeinateStatusSegment.ariaLabel',
        '{{title}}, {{status}}',
        {
          title: getAgentAwakeTitle(),
          status: `${getAgentAwakeModeLabel('off')} · ${translate(
            'auto.components.status.bar.CaffeinateStatusSegment.inactive',
            'Inactive'
          )}`
        }
      ),
      onDescription: translate(
        'auto.components.status.bar.CaffeinateStatusSegment.onDescription',
        'Keep this computer awake continuously'
      ),
      autoDescription: translate(
        'auto.components.status.bar.CaffeinateStatusSegment.autoDescription',
        'Stay awake while an agent is working'
      ),
      offDescription: translate(
        'auto.components.status.bar.CaffeinateStatusSegment.offDescription',
        'Allow normal system sleep behavior'
      )
    }).toEqual(SYNTHETIC_COPY)
  })

  it('renders the localized trigger and complete menu', async () => {
    await i18n.changeLanguage(SYNTHETIC_LOCALE)
    storeMocks.settings = {
      computerAwakeMode: 'auto',
      keepComputerAwakeWhileAgentsRun: true
    }
    awakeMocks.status = { mode: 'auto', active: true }

    render(<CaffeinateStatusSegment iconOnly={false} />)

    const trigger = await screen.findByRole('button', {
      name: 'Mantener la computadora activa, Agente · Activo'
    })
    expect(trigger.textContent).toContain('Agente')

    const menu = screen.getByRole('menu')
    await waitFor(() => expect(menu.textContent).toContain('Mantener la computadora activa'))
    expect(menu.textContent).toContain('Agente · Activo')
    const [onItem, agentItem, offItem] = screen.getAllByRole('menuitemradio') as [
      HTMLElement,
      HTMLElement,
      HTMLElement
    ]
    expect(within(onItem).getByText(SYNTHETIC_COPY.on)).toBeTruthy()
    expect(within(onItem).getByText(SYNTHETIC_COPY.onDescription)).toBeTruthy()
    expect(within(agentItem).getByText(SYNTHETIC_COPY.auto)).toBeTruthy()
    expect(within(agentItem).getByText(SYNTHETIC_COPY.autoDescription)).toBeTruthy()
    expect(within(offItem).getByText(SYNTHETIC_COPY.off)).toBeTruthy()
    expect(within(offItem).getByText(SYNTHETIC_COPY.offDescription)).toBeTruthy()
  })
})
