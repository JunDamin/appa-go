/* ============================================================
   furniture.js — buildFurniture 임시 stub (통합 세션 제공)
   ------------------------------------------------------------
   game.js:157 의 buildFurniture(this) 호출이 본문 미구현 상태라
   부팅이 막혀(ReferenceError) 통합 빌드가 RED였다. game.js(시스템
   세션 소유)를 침범하지 않기 위해, 전역 stub을 game.js보다 먼저
   로드해 부팅을 통과시킨다.

   - 현재 furn-* 텍스처를 참조하는 코드가 없어 no-op으로 안전.
   - 시스템 세션이 game.js 안(IIFE 내부)에 실제 buildFurniture를
     정의하면 그 지역 함수가 이 전역을 가려(shadow) 우선 적용된다.
     따라서 충돌 없이 공존하며, 구현 완료 후 이 파일은 제거 가능.
   ============================================================ */
window.buildFurniture = function buildFurniture(scene) {
  // no-op: 실내 가구 텍스처(furn-*)는 아직 참조되지 않음. 시스템 세션 구현 예정.
};
