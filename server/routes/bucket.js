const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');

// 사용자 데이터 저장 경로 (실제 앱에서는 데이터베이스 사용)
const USER_DATA_PATH = path.join(__dirname, '../data/user_data.json');

// 사용자 데이터 초기화
async function initUserData() {
  try {
    await fs.ensureDir(path.dirname(USER_DATA_PATH));
    if (!(await fs.pathExists(USER_DATA_PATH))) {
      const initialData = {
        bucketLists: [],
        savings: {
          total: 350000,
          monthly: 85000,
          history: [
            { month: '2024-11', amount: 85000, source: '월세 세액공제' },
            { month: '2024-10', amount: 78000, source: '청년도약계좌' },
            { month: '2024-09', amount: 92000, source: '카드 세액공제' }
          ]
        },
        achievements: []
      };
      await fs.writeJson(USER_DATA_PATH, initialData, { spaces: 2 });
    }
  } catch (error) {
    console.error('사용자 데이터 초기화 오류:', error);
  }
}

// 사용자 데이터 로드
async function loadUserData() {
  try {
    await initUserData();
    return await fs.readJson(USER_DATA_PATH);
  } catch (error) {
    console.error('사용자 데이터 로드 오류:', error);
    return null;
  }
}

// 사용자 데이터 저장
async function saveUserData(data) {
  try {
    await fs.writeJson(USER_DATA_PATH, data, { spaces: 2 });
    return true;
  } catch (error) {
    console.error('사용자 데이터 저장 오류:', error);
    return false;
  }
}

// 모든 버킷리스트 조회
router.get('/', async (req, res) => {
  try {
    const userData = await loadUserData();
    if (!userData) {
      return res.status(500).json({
        success: false,
        error: '사용자 데이터를 불러올 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: userData.bucketLists
    });

  } catch (error) {
    console.error('버킷리스트 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '버킷리스트 조회 중 오류가 발생했습니다.'
    });
  }
});

// 새 버킷리스트 추가
router.post('/', async (req, res) => {
  try {
    const { name, target, deadline } = req.body;

    if (!name || !target) {
      return res.status(400).json({
        success: false,
        error: '이름과 목표 금액은 필수입니다.'
      });
    }

    const userData = await loadUserData();
    if (!userData) {
      return res.status(500).json({
        success: false,
        error: '사용자 데이터를 불러올 수 없습니다.'
      });
    }

    const newBucket = {
      id: Date.now(),
      name,
      target: parseInt(target),
      saved: 0,
      deadline: deadline || null,
      createdAt: new Date().toISOString(),
      progress: 0
    };

    userData.bucketLists.push(newBucket);
    
    const saved = await saveUserData(userData);
    if (!saved) {
      return res.status(500).json({
        success: false,
        error: '데이터 저장에 실패했습니다.'
      });
    }

    res.json({
      success: true,
      data: newBucket
    });

  } catch (error) {
    console.error('버킷리스트 추가 오류:', error);
    res.status(500).json({
      success: false,
      error: '버킷리스트 추가 중 오류가 발생했습니다.'
    });
  }
});

// 버킷리스트 수정
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, target, deadline, saved } = req.body;

    const userData = await loadUserData();
    if (!userData) {
      return res.status(500).json({
        success: false,
        error: '사용자 데이터를 불러올 수 없습니다.'
      });
    }

    const bucketIndex = userData.bucketLists.findIndex(bucket => bucket.id === parseInt(id));
    
    if (bucketIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '해당 버킷리스트를 찾을 수 없습니다.'
      });
    }

    const bucket = userData.bucketLists[bucketIndex];
    
    if (name !== undefined) bucket.name = name;
    if (target !== undefined) bucket.target = parseInt(target);
    if (deadline !== undefined) bucket.deadline = deadline;
    if (saved !== undefined) bucket.saved = parseInt(saved);
    
    bucket.progress = Math.round((bucket.saved / bucket.target) * 100);
    bucket.updatedAt = new Date().toISOString();

    const dataSaved = await saveUserData(userData);
    if (!dataSaved) {
      return res.status(500).json({
        success: false,
        error: '데이터 저장에 실패했습니다.'
      });
    }

    res.json({
      success: true,
      data: bucket
    });

  } catch (error) {
    console.error('버킷리스트 수정 오류:', error);
    res.status(500).json({
      success: false,
      error: '버킷리스트 수정 중 오류가 발생했습니다.'
    });
  }
});

// 버킷리스트 삭제
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const userData = await loadUserData();
    if (!userData) {
      return res.status(500).json({
        success: false,
        error: '사용자 데이터를 불러올 수 없습니다.'
      });
    }

    const bucketIndex = userData.bucketLists.findIndex(bucket => bucket.id === parseInt(id));
    
    if (bucketIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '해당 버킷리스트를 찾을 수 없습니다.'
      });
    }

    userData.bucketLists.splice(bucketIndex, 1);

    const saved = await saveUserData(userData);
    if (!saved) {
      return res.status(500).json({
        success: false,
        error: '데이터 저장에 실패했습니다.'
      });
    }

    res.json({
      success: true,
      message: '버킷리스트가 삭제되었습니다.'
    });

  } catch (error) {
    console.error('버킷리스트 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '버킷리스트 삭제 중 오류가 발생했습니다.'
    });
  }
});

// 절세 현황 조회
router.get('/savings/status', async (req, res) => {
  try {
    const userData = await loadUserData();
    if (!userData) {
      return res.status(500).json({
        success: false,
        error: '사용자 데이터를 불러올 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: userData.savings
    });

  } catch (error) {
    console.error('절세 현황 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '절세 현황 조회 중 오류가 발생했습니다.'
    });
  }
});

// 절세 목표 달성도 조회
router.get('/progress', async (req, res) => {
  try {
    const userData = await loadUserData();
    if (!userData) {
      return res.status(500).json({
        success: false,
        error: '사용자 데이터를 불러올 수 없습니다.'
      });
    }

    const totalTarget = userData.bucketLists.reduce((sum, bucket) => sum + bucket.target, 0);
    const totalSaved = userData.savings.total;
    const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalTarget,
        totalSaved,
        overallProgress,
        bucketCount: userData.bucketLists.length,
        completedBuckets: userData.bucketLists.filter(bucket => bucket.progress >= 100).length
      }
    });

  } catch (error) {
    console.error('진행도 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '진행도 조회 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
