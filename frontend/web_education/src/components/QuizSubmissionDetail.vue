<template>
  <teleport to="body">
    <div class="modal-overlay" v-if="show">
      <div class="modal">
        <button class="close-btn" @click="close">×</button>

        <!-- Thông tin chung -->
        <div class="summary">
          <h2>{{ quiz.title }}</h2>
          <p><strong>Thời gian nộp:</strong> {{ formatDate(submission?.submittedAt) }}</p>
          <p><strong>Điểm:</strong> {{ submission?.score }}/10</p>
          <p><strong>Tên:</strong> {{ submission?.studentId?.fullname }}</p>
        </div>

        
        <div 
            v-for="(q, index) in quiz.questions" 
            :key="index" 
            class="question-card"
            >
            <h3>Câu {{ index + 1 }}: {{ q.questionText }}</h3> 
            <ul class="options">
                <li 
                v-for="(label, key) in q.options" 
                :key="key"
                :class="getOptionClass(index, key)"
                >
                <span class="label">{{ key }}.</span> {{ label }}
                
                <!-- icon ✔ hoặc ✘ -->
                <span v-if="isSelected(index, key) && isCorrect(index, key)" class="icon success">✔</span>
                <span v-else-if="isSelected(index, key) && !isCorrect(index, key)" class="icon error">✘</span>
                <span v-else-if="!isSelected(index, key) && isCorrect(index, key)" class="icon correct-answer">✔</span>
                </li>
            </ul>
            </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed } from 'vue'
import { toRefs } from 'vue'

const props = defineProps({
  show: Boolean,
  quiz: Object,
  submission: Object
})

const emit = defineEmits(['close'])

const { quiz, submission } = toRefs(props)

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString()
}

const optionLabel = (index) => String.fromCharCode(65 + index)
console.log(submission?.value?.answers);
const isSelected = (questionIndex, optionKey) => {
  const ans = submission.value?.answers?.find(a => a.questionIndex === questionIndex)
  return ans?.selectedOption === optionKey
}

const isCorrect = (questionIndex, optionKey) => {
  return quiz.value?.questions[questionIndex]?.correctAnswer === optionKey
}

const getOptionClass = (questionIndex, optionKey) => {
  const selected = isSelected(questionIndex, optionKey)
  const correct = isCorrect(questionIndex, optionKey)

  return {
    option: true,
    selected,
    correct: !selected && correct,
    'correct-selected': selected && correct,
    wrong: selected && !correct,
  }
}

const close = () => {
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
    display: block !important;
  opacity: 1 !important;
  z-index: 9999 !important;
  background: white;
  padding: 24px;
  width: 90%;
  max-width: 700px;
  border-radius: 12px;
  position: relative;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 16px;
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
}

.summary {
  margin-bottom: 24px;
  text-align: center;
}

.question-card {
  margin-bottom: 20px;
}

.options {
  list-style: none;
  padding: 0;
}

.option {
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid #ccc;
}

.correct {
  background-color: #e6ffe6;
  border-color: #28a745;
}

.wrong {
  background-color: #ffe6e6;
  border-color: #dc3545;
}

.selected {
  font-weight: bold;
}

.label {
  font-weight: bold;
  margin-right: 8px;
}
.icon {
  margin-left: 8px;
  font-weight: bold;
}

.icon.success {
  color: green;
}

.icon.error {
  color: red;
}

.icon.correct-answer {
  color: green;
  opacity: 0.6;
}

.correct-selected {
  background-color: #e6ffe6;
  border-color: #28a745;
}

.wrong {
  background-color: #ffe6e6;
  border-color: #dc3545;
}

.correct {
  background-color: #fff86d;
  border-color: #7dd3fc;
}
.icon {
  margin-left: 8px;
  font-weight: bold;
}

.icon.success {
  color: green;
}

.icon.error {
  color: red;
}

.icon.correct-answer {
  color: green;
  opacity: 0.6;
}

.correct-selected {
  background-color: #e6ffe6;
  border-color: #28a745;
}

.wrong {
  background-color: #ffe6e6;
  border-color: #dc3545;
}

.correct {
  background-color: #f0fdf4;
  border-color: #7dd3fc;
}
</style>
