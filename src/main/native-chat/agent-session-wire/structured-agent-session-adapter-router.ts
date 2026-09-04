// One host, two provider lanes.
//
// The host holds a single adapter slot on purpose: the lease, the journal and the fence are the
// host's, not a provider's. So a second provider arrives as a router in front of that slot, never
// as a second host — and never as a second notion of a structured session.
//
// A session is routed by the lane that acquired it. Nothing infers the lane from a session id
// prefix: a guess there puts one lane's answer on the other lane's child.

import type { AgentSessionExecutionLocation } from '../../../shared/agent-session-record'
import type { AgentSessionRecord } from '../../../shared/agent-session-record'
import { adapterSupportsCreate } from './structured-agent-session-provider-support'
import type { StructuredAgentSessionAdapter } from './structured-agent-session-adapter'

export type StructuredAgentSessionAdapterLane = {
  /** Provider name in the durable record: `codex`, `claude`. */
  provider: AgentSessionRecord['provider']
  adapter: StructuredAgentSessionAdapter
}

export class StructuredAgentSessionAdapterRouter implements StructuredAgentSessionAdapter {
  private readonly laneBySession = new Map<string, StructuredAgentSessionAdapter>()

  constructor(private readonly lanes: readonly StructuredAgentSessionAdapterLane[]) {}

  // Asked through `adapterSupportsCreate`, not through `supportsCreate` directly: a lane that never
  // declared the newer method — the Codex one — still answers correctly through its fallback.
  supportsCreate = (location: AgentSessionExecutionLocation, agent: string): boolean =>
    this.lanes.some((lane) => adapterSupportsCreate(lane.adapter, location, agent))

  supportsLocation = (location: AgentSessionExecutionLocation): boolean =>
    this.lanes.some((lane) => lane.adapter.supportsLocation?.(location) === true)

  acquire: StructuredAgentSessionAdapter['acquire'] = async (input) => {
    const lane = this.laneForProvider(input.identity.agent)
    const acquisition = await lane.acquire(input)
    this.laneBySession.set(input.identity.sessionId, lane)
    return acquisition
  }

  // Every per-session method is async so a missing route rejects instead of throwing out of a
  // promise-returning call: a synchronous throw here would escape the host's own error handling.
  dispatch: StructuredAgentSessionAdapter['dispatch'] = async (input) =>
    await this.laneFor(input.sessionId).dispatch(input)

  cancelTurn: StructuredAgentSessionAdapter['cancelTurn'] = async (input) =>
    await this.laneFor(input.sessionId).cancelTurn(input)

  answerPrompt: StructuredAgentSessionAdapter['answerPrompt'] = async (input) =>
    await this.laneFor(input.sessionId).answerPrompt(input)

  setOption: StructuredAgentSessionAdapter['setOption'] = async (input) =>
    await this.laneFor(input.sessionId).setOption(input)

  readOptions: StructuredAgentSessionAdapter['readOptions'] = async (input) => {
    const lane = this.laneFor(input.sessionId)
    if (!lane.readOptions) {
      throw new Error(`the lane owning ${input.sessionId} reports no session options`)
    }
    return await lane.readOptions(input)
  }

  historyFilePath: StructuredAgentSessionAdapter['historyFilePath'] = async (input) =>
    (await this.laneBySession
      .get(input.identity.sessionId)
      ?.historyFilePath?.({ identity: input.identity })) ?? null

  releaseAcquisition: StructuredAgentSessionAdapter['releaseAcquisition'] = (input) =>
    this.forEachOwner(input.sessionId, (lane) =>
      lane.releaseAcquisition?.({ sessionId: input.sessionId })
    )

  closeSession: StructuredAgentSessionAdapter['closeSession'] = (sessionId) =>
    this.forEachOwner(sessionId, (lane) => lane.closeSession?.(sessionId))

  forceCloseSession: StructuredAgentSessionAdapter['forceCloseSession'] = (sessionId) =>
    this.forEachOwner(sessionId, (lane) => lane.forceCloseSession?.(sessionId))

  disposeSession: StructuredAgentSessionAdapter['disposeSession'] = (sessionId) =>
    this.forEachOwner(sessionId, (lane) => lane.disposeSession?.(sessionId))

  /** Teardown asks every lane: a session acquired before this router existed has no route entry. */
  closeAll = async (): Promise<void> => {
    this.laneBySession.clear()
    for (const lane of this.lanes) {
      const closeAll = (lane.adapter as { closeAll?: () => Promise<void> }).closeAll
      if (closeAll) {
        await closeAll.call(lane.adapter)
      }
    }
  }

  private async forEachOwner(
    sessionId: string,
    call: (lane: StructuredAgentSessionAdapter) => Promise<boolean> | undefined
  ): Promise<boolean> {
    const owner = this.laneBySession.get(sessionId)
    if (owner) {
      this.laneBySession.delete(sessionId)
      return (await call(owner)) === true
    }
    // No route entry: the session was never acquired here, so closing is vacuously proven only if
    // every lane agrees it holds nothing.
    let proven = true
    for (const lane of this.lanes) {
      proven = (await call(lane.adapter)) === true && proven
    }
    return proven
  }

  private laneForProvider(agent: string): StructuredAgentSessionAdapter {
    const lane = this.lanes.find((candidate) => candidate.provider === agent)
    if (!lane) {
      throw new Error(`no structured lane for ${agent}`)
    }
    return lane.adapter
  }

  private laneFor(sessionId: string): StructuredAgentSessionAdapter {
    const lane = this.laneBySession.get(sessionId)
    if (!lane) {
      throw new Error(`no structured lane holds session ${sessionId}`)
    }
    return lane
  }
}
