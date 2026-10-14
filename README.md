# BA Combat 학생 데이터

이 브랜치는 GitHub Actions(`.github/workflows/sync-students.yml`)가 매일 자동으로 갱신합니다. 직접 고치지 마세요.

- `students.json`: [SchaleDB](https://schaledb.com)의 한국어 학생 데이터에서 BA Combat 앱이 쓰는 필드(Id, Name, SquadType, IsReleased, DefaultOrder)만 남긴 것
- `meta.json`: 출처, 학생 수, `students.json`의 SHA-256

데이터의 출처는 SchaleDB입니다. 앱은 이 파일을 먼저 받고, 받을 수 없으면 SchaleDB에서 직접 받습니다. 학생 아이콘은 이 브랜치에 두지 않으며 앱이 SchaleDB에서 받습니다.
