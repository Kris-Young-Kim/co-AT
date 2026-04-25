export type DocumentResource = {
  id: number
  title: string
  date: string
}

export const documentResources: DocumentResource[] = [
  { id: 35, title: "강원특별자치도 보조기기센터 통계자료집", date: "2023-12-15" },
  { id: 32, title: "2023 보조기기 행복드림 - 중앙 및 지역 보조기기센터 소식지", date: "2023-07-05" },
  { id: 31, title: "2023 장애인보조기기 교부사업 안내 포스터", date: "2023-06-08" },
  { id: 30, title: "2023년 장애인보조기기교부사업 담당자 역량강화교육 교재(4.7)", date: "2023-04-21" },
  { id: 29, title: "장애인보조기기교부사업 그림으로 보는 보조기기 안내서", date: "2023-02-21" },
  { id: 27, title: "2022년 강원도 장애인보조기기교부사업 담당자교육자료", date: "2022-08-31" },
  { id: 26, title: "2022 보조기기교부사업 표준교육자료(중앙보조기기센터)", date: "2022-04-18" },
  { id: 25, title: "2021 춘천시 커뮤니티케어 장애인재활보조기기지원사업 결과보고서", date: "2022-02-25" },
  { id: 24, title: "보조기기센터 홍보 소식지 희망드림 2021.12. (VOL.9)", date: "2021-12-31" },
  { id: 23, title: "개소 3주년 기념 온라인 세미나 교재 - 4차 산업혁명과 지역보조기기센터의 역할", date: "2021-11-17" },
]

export type VideoResource = {
  id: number
  title: string
  date: string
  youtubeIds: string[]
  desc: string
}

export const videoResources: VideoResource[] = [
  {
    id: 22,
    title: "한소네6 옵션 활용법",
    date: "2023-12-11",
    youtubeIds: ["nkaV5BdX6JE"],
    desc: "한소네6 옵션 활용영상입니다.",
  },
  {
    id: 21,
    title: "책마루3",
    date: "2023-12-11",
    youtubeIds: ["2wFTV-R2Mh4"],
    desc: "책마루3 활용 방법 영상입니다.",
  },
  {
    id: 20,
    title: "[울산광역시보조기기센터] 전동휠체어용 우의",
    date: "2023-03-13",
    youtubeIds: ["BttWIN7Nqz8"],
    desc: "울산광역시보조기기센터에서 제작한 영상입니다.",
  },
  {
    id: 19,
    title: "노인 생활보조기기의 올바른 사용",
    date: "2022-04-11",
    youtubeIds: ["oiU35-8ZMwY"],
    desc: "중앙보조기기센터: [생활안전_작업안전] 노인 생활보조기구의 올바른 사용(노인자동차 등) - 국민안전처(2017)",
  },
  {
    id: 17,
    title: "정보통신보조기기보급사업 품목 동영상",
    date: "2021-05-18",
    youtubeIds: ["_avxt3tEZ7k", "Yty1Mseja7k"],
    desc: "한국지능정보사회진흥원에서 지원하는 정보통신보조기기보급사업 제품 동영상입니다. 화면낭독 S/W와 안구마우스 관련 영상입니다.",
  },
  {
    id: 16,
    title: "소보로 탭 비즈니스",
    date: "2021-05-13",
    youtubeIds: ["A5wzF4r7VP8"],
    desc: "청각장애인의 의사소통을 위해 개발된 기기입니다. 한국장애인고용공단 '보조공학기기 지원사업'에서 지원받으실 수 있습니다.",
  },
  {
    id: 15,
    title: "소보로 탭 라이트",
    date: "2021-05-13",
    youtubeIds: ["y6vvudqBn5g"],
    desc: "청각장애인의 의사소통을 위해 개발된 기기입니다. 한국지능정보사회진흥원 '정보통신보조기기보급사업'에서 지원받으실 수 있습니다.",
  },
  {
    id: 14,
    title: "소보로 탭 AAC",
    date: "2021-05-13",
    youtubeIds: ["6SFDCvLm-Js"],
    desc: "발달장애인분들을 위해 개발된 AAC입니다. 그림, 음성인식자막과 동시에 양방향 소통이 가능합니다. 한국장애인고용공단 '보조공학기기지원사업'에서 지원합니다.",
  },
  {
    id: 13,
    title: "소변수집장치(남,여 공용소변기PHN-B100-J) - 장애인보조기기교부사업 지원품목",
    date: "2021-04-06",
    youtubeIds: ["ElUf0iCxpeM"],
    desc: "소변을 보면 자동으로 흡입하여 소변통으로 모아주는 장치입니다. 장애인보조기기교부사업 지원품목입니다.",
  },
  {
    id: 12,
    title: "미끄럼보드 사용법",
    date: "2021-04-06",
    youtubeIds: ["Ygo5BYoqb-E"],
    desc: "미끄럼보드는 장애인보조기기교부사업에서 지원하고 있는 품목입니다.",
  },
  {
    id: 11,
    title: "소변용 수집장치(남성용소변기PHN-D100-M) - 장애인보조기기교부사업 지원품목",
    date: "2021-04-06",
    youtubeIds: ["ElUf0iCxpeM"],
    desc: "소변을 보면 자동으로 흡입하여 소변통으로 모아주는 장치입니다. 장애인보조기기교부사업 지원품목입니다.",
  },
  {
    id: 10,
    title: "소변수집장치(여성용소변기PHN-D100-W)",
    date: "2021-04-06",
    youtubeIds: ["wx-XIhtslKI"],
    desc: "소변을 보면 자동으로 흡입하여 소변통으로 모아주는 장치입니다.",
  },
]
