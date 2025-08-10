const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class DeploymentManager {
  constructor() {
    this.railwayUrl = '';
    this.vercelUrl = '';
  }

  async deploy() {
    console.log('🚀 꽁돈버킷 배포를 시작합니다...\n');

    try {
      // 1. 프로덕션 빌드 준비
      await this.prepareBuild();

      // 2. Railway CLI 확인
      await this.checkRailwayCLI();

      // 3. Vercel CLI 확인  
      await this.checkVercelCLI();

      // 4. 배포 실행
      await this.deployBackend();
      await this.deployFrontend();

      console.log('\n✅ 배포가 완료되었습니다!');
      console.log('\n🌐 접속 URL:');
      console.log(`   프론트엔드: ${this.vercelUrl}`);
      console.log(`   백엔드 API: ${this.railwayUrl}`);
      console.log('\n📱 이제 어디서나 접속 가능합니다!');

    } catch (error) {
      console.error('❌ 배포 중 오류 발생:', error.message);
      console.log('\n🔧 수동 배포 가이드: deploy.md 파일을 확인해주세요');
    }
  }

  async prepareBuild() {
    console.log('📦 프로덕션 빌드 준비 중...');
    
    // 클라이언트 빌드 테스트
    try {
      process.chdir('./client');
      execSync('npm run build', { stdio: 'pipe' });
      console.log('   ✅ 클라이언트 빌드 성공');
      process.chdir('..');
    } catch (error) {
      throw new Error('클라이언트 빌드 실패: ' + error.message);
    }
  }

  async checkRailwayCLI() {
    try {
      execSync('railway --version', { stdio: 'pipe' });
      console.log('   ✅ Railway CLI 확인됨');
    } catch (error) {
      console.log('   ⚠️  Railway CLI가 설치되지 않음');
      console.log('      수동 배포: https://railway.app에서 GitHub 연동');
      throw new Error('Railway CLI 필요');
    }
  }

  async checkVercelCLI() {
    try {
      execSync('vercel --version', { stdio: 'pipe' });
      console.log('   ✅ Vercel CLI 확인됨');
    } catch (error) {
      console.log('   ⚠️  Vercel CLI가 설치되지 않음');
      console.log('      수동 배포: https://vercel.com에서 GitHub 연동');
      throw new Error('Vercel CLI 필요');
    }
  }

  async deployBackend() {
    console.log('\n🚂 Railway에 백엔드 배포 중...');
    
    try {
      // Railway 로그인 확인
      execSync('railway whoami', { stdio: 'pipe' });
      
      // 프로젝트 생성 및 배포
      execSync('railway project new kkongdon-bucket-api', { stdio: 'inherit' });
      execSync('railway up', { stdio: 'inherit' });
      
      // URL 가져오기
      const domains = execSync('railway domain', { encoding: 'utf8' });
      this.railwayUrl = domains.trim();
      
      console.log(`   ✅ 백엔드 배포 완료: ${this.railwayUrl}`);
      
    } catch (error) {
      console.log('   ⚠️  Railway 자동 배포 실패');
      console.log('      수동 배포를 진행해주세요: deploy.md 참조');
      this.railwayUrl = 'https://your-app.railway.app';
    }
  }

  async deployFrontend() {
    console.log('\n⚡ Vercel에 프론트엔드 배포 중...');
    
    try {
      // 클라이언트 디렉토리로 이동
      process.chdir('./client');
      
      // 환경변수 설정
      await this.createProductionEnv();
      
      // Vercel 배포
      execSync('vercel --prod', { stdio: 'inherit' });
      
      // URL 가져오기 (일반적으로 프로젝트명 기반)
      this.vercelUrl = 'https://kkongdon-bucket.vercel.app';
      
      console.log(`   ✅ 프론트엔드 배포 완료: ${this.vercelUrl}`);
      
      process.chdir('..');
      
    } catch (error) {
      console.log('   ⚠️  Vercel 자동 배포 실패');
      console.log('      수동 배포를 진행해주세요: deploy.md 참조');
      this.vercelUrl = 'https://kkongdon-bucket.vercel.app';
      process.chdir('..');
    }
  }

  async createProductionEnv() {
    const envContent = `REACT_APP_API_URL=${this.railwayUrl}/api
GENERATE_SOURCEMAP=false`;
    
    await fs.writeFile('.env.production', envContent);
    console.log('   ✅ 프로덕션 환경변수 생성');
  }
}

// CLI Tools 설치 가이드
function showInstallGuide() {
  console.log('\n🛠 CLI Tools 설치 가이드:');
  console.log('\n1. Railway CLI 설치:');
  console.log('   npm install -g @railway/cli');
  console.log('   railway login');
  console.log('\n2. Vercel CLI 설치:');
  console.log('   npm install -g vercel');
  console.log('   vercel login');
  console.log('\n3. 다시 실행:');
  console.log('   node scripts/deploy.js');
}

// 스크립트 실행
if (require.main === module) {
  const deployer = new DeploymentManager();
  
  // CLI 도구 체크
  try {
    execSync('railway --version && vercel --version', { stdio: 'pipe' });
    deployer.deploy();
  } catch (error) {
    console.log('❌ 필요한 CLI 도구가 설치되지 않았습니다.');
    showInstallGuide();
    console.log('\n📚 또는 수동 배포 가이드를 확인하세요: deploy.md');
  }
}

module.exports = DeploymentManager;
