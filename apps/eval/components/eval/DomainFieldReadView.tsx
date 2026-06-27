'use client'

import {
  WCFields, ADLFields, SFields, SPFields, ECFields,
  CAFields, LFields, AACFields, AMFields,
} from './domain-fields'
import type { AssessmentDomainType } from './DomainSelector'
import type { DomainData } from './domain-fields/shared'

interface Props {
  domain: AssessmentDomainType
  data: DomainData
}

const noop = () => {}

export function DomainFieldReadView({ domain, data }: Props) {
  return (
    <div className="pointer-events-none select-none opacity-90">
      {domain === 'WC'  && <WCFields  data={data} set={noop} />}
      {domain === 'ADL' && <ADLFields data={data} set={noop} />}
      {domain === 'S'   && <SFields   data={data} set={noop} />}
      {domain === 'SP'  && <SPFields  data={data} set={noop} />}
      {domain === 'EC'  && <ECFields  data={data} set={noop} />}
      {domain === 'CA'  && <CAFields  data={data} set={noop} />}
      {domain === 'L'   && <LFields   data={data} set={noop} />}
      {domain === 'AAC' && <AACFields data={data} set={noop} />}
      {domain === 'AM'  && <AMFields  data={data} set={noop} />}
    </div>
  )
}
