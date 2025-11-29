class Api::V1::AttemptsController < ApplicationController
  before_action :set_attempt, only: [:show]

  # GET /api/v1/attempts
  def index
    @attempts = Attempt.all.order(created_at: :desc)
    # In production, filter by current_user: @attempts = Attempt.where(user_id: current_user[:id])
    render json: @attempts, include: [:quiz, { answers: { include: :question } }]
  end

  # GET /api/v1/attempts/:id
  def show
    render json: @attempt, include: { quiz: { include: { questions: { include: :options } } }, answers: { include: :question } }
  end

  # POST /api/v1/attempts
  # Expected params: { quiz_id: 1, answers: [{ question_id: 1, response: "answer" }, ...] }
  def create
    quiz_id = params[:quiz_id] || params.dig(:attempt, :quiz_id)
    @quiz = Quiz.find(quiz_id)
    @attempt = @quiz.attempts.build(sore: 0)

    if @attempt.save
      # Create answers from the submitted responses
      answers_data = params[:answers] || params.dig(:attempt, :answers) || []
      answers_data.each do |answer_params|
        @attempt.answers.create(
          question_id: answer_params[:question_id] || answer_params['question_id'],
          response: answer_params[:response] || answer_params['response']
        )
      end

      # Calculate and save the score
      @attempt.calculate_score!

      # Reload to get fresh associations
      @attempt.reload

      render json: {
        attempt: {
          id: @attempt.id,
          quiz_id: @attempt.quiz_id,
          sore: @attempt.sore,
          created_at: @attempt.created_at,
          updated_at: @attempt.updated_at,
          answers: @attempt.answers.as_json(include: { question: { include: :options } })
        },
        score: @attempt.sore,
        total_questions: @quiz.questions.count,
        quiz: @quiz.as_json(only: [:id, :title])
      }, status: :created
    else
      render json: { errors: @attempt.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Quiz not found' }, status: :not_found
  end

  private

  def set_attempt
    @attempt = Attempt.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Attempt not found' }, status: :not_found
  end
end
