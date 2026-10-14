// SchaleDB 학생 데이터(한국어)를 받아 BA Combat 앱이 쓰는 필드만 남겨 저장한다.
// 형식이 이상하면 실패해서(종료 코드 1) data 브랜치의 기존 데이터를 덮지 않는다.
// 사용: node .github/scripts/sync-students.mjs <출력 폴더>

import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const SOURCE = 'https://schaledb.com/data/kr/students.min.json'
const MIN_STUDENTS = 100
const out = process.argv[2] ?? 'out'

const res = await fetch(SOURCE, {
  headers: { 'user-agent': 'BA-Combat student data sync (+https://github.com/NXYUI/BA-Combat)' },
  signal: AbortSignal.timeout(60_000),
})
if (!res.ok) throw new Error(`SchaleDB 응답 오류: HTTP ${res.status}`)
const raw = await res.json()
const list = Array.isArray(raw) ? raw : Object.values(raw)

const problems = []
const students = []
for (const s of list) {
  const ok =
    Number.isInteger(s?.Id) &&
    typeof s?.Name === 'string' &&
    s.Name.trim() !== '' &&
    (s?.SquadType === 'Main' || s?.SquadType === 'Support') &&
    Array.isArray(s?.IsReleased) &&
    s.IsReleased.length >= 2 &&
    s.IsReleased.every((v) => typeof v === 'boolean')
  if (!ok) {
    problems.push(s?.Id ?? '(Id 없음)')
    continue
  }
  students.push({
    Id: s.Id,
    Name: s.Name,
    SquadType: s.SquadType,
    IsReleased: s.IsReleased,
    DefaultOrder: Number.isFinite(s.DefaultOrder) ? s.DefaultOrder : s.Id,
  })
}

if (students.length < MIN_STUDENTS) throw new Error(`학생이 ${students.length}명뿐이에요. SchaleDB 형식이 바뀌었을 수 있어요.`)
// 일부만 이상하면 그 항목만 빼고 진행하되, 많이 이상하면 형식이 바뀐 것으로 보고 멈춘다
if (problems.length > list.length * 0.05) throw new Error(`형식이 맞지 않는 항목이 ${problems.length}개예요: ${problems.slice(0, 10).join(', ')}`)
if (problems.length) console.warn(`형식이 맞지 않아 뺀 항목: ${problems.join(', ')}`)

students.sort((a, b) => a.Id - b.Id)
const body = JSON.stringify(students) + '\n'
const sha256 = createHash('sha256').update(body).digest('hex')

await mkdir(out, { recursive: true })
await writeFile(join(out, 'students.json'), body)
// 날짜를 넣지 않는다: 내용이 같으면 파일도 같아서 커밋이 생기지 않는다 (갱신 시각은 커밋 기록으로 본다)
await writeFile(join(out, 'meta.json'), JSON.stringify({ schema: 1, source: SOURCE, count: students.length, sha256 }, null, 2) + '\n')
await writeFile(
  join(out, 'README.md'),
  `# BA Combat 학생 데이터

이 브랜치는 GitHub Actions(\`.github/workflows/sync-students.yml\`)가 매일 자동으로 갱신합니다. 직접 고치지 마세요.

- \`students.json\`: [SchaleDB](https://schaledb.com)의 한국어 학생 데이터에서 BA Combat 앱이 쓰는 필드(Id, Name, SquadType, IsReleased, DefaultOrder)만 남긴 것
- \`meta.json\`: 출처, 학생 수, \`students.json\`의 SHA-256

데이터의 출처는 SchaleDB입니다. 앱은 이 파일을 먼저 받고, 받을 수 없으면 SchaleDB에서 직접 받습니다. 학생 아이콘은 이 브랜치에 두지 않으며 앱이 SchaleDB에서 받습니다.
`,
)
console.log(`학생 ${students.length}명, sha256 ${sha256.slice(0, 12)}…`)
