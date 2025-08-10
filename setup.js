const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

async function setup() {
  console.log('🚀 꽁돈버킷 앱 설정을 시작합니다...\n');

  try {
    // 1. 서버 디렉토리 확인 및 npm install
    console.log('📦 서버 의존성 설치 중...');
    process.chdir('./server');
    execSync('npm install', { stdio: 'inherit' });

    // 2. 복지 데이터 처리
    console.log('\n📊 복지 데이터 처리 중...');
    execSync('node scripts/processWelfareData.js', { stdio: 'inherit' });

    // 3. 클라이언트 디렉토리로 이동 및 npm install
    console.log('\n📦 클라이언트 의존성 설치 중...');
    process.chdir('../client');
    execSync('npm install', { stdio: 'inherit' });

    // 4. Tailwind CSS 설정
    console.log('\n🎨 Tailwind CSS 설정 중...');
    execSync('npm install -D tailwindcss postcss autoprefixer', { stdio: 'inherit' });

    // 5. PostCSS 설정 파일 생성
    const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
    await fs.writeFile('postcss.config.js', postcssConfig);

    // 6. 루트로 돌아가기
    process.chdir('..');

    console.log('\n✅ 설정이 완료되었습니다!');
    console.log('\n🏃‍♂️ 실행 방법:');
    console.log('   npm run dev     # 프론트엔드 + 백엔드 동시 실행');
    console.log('   npm run server  # 백엔드만 실행');
    console.log('   npm run client  # 프론트엔드만 실행');
    console.log('\n🌐 접속 URL:');
    console.log('   프론트엔드: http://localhost:3000');
    console.log('   백엔드 API: http://localhost:5000');
    console.log('\n⚠️  중요: server/.env 파일에서 GEMINI_API_KEY를 설정해주세요!');

  } catch (error) {
    console.error('❌ 설정 중 오류 발생:', error.message);
    console.log('\n🔧 수동 설정 방법:');
    console.log('1. cd server && npm install');
    console.log('2. cd ../client && npm install');
    console.log('3. server/.env에서 GEMINI_API_KEY 설정');
    console.log('4. npm run dev');
  }
}

setup();
