class Api::V1::QuizzesController < ApplicationController
  before_action :set_quiz, only: [:show, :update, :destroy]

  # GET /api/v1/quizzes
  def index
    @quizzes = Quiz.all.order(created_at: :desc)
    render json: @quizzes, include: [:questions]
  end

  # GET /api/v1/quizzes/:id
  def show
    render json: @quiz, include: { questions: { include: :options } }
  end

  # POST /api/v1/quizzes
  def create
    @quiz = Quiz.new(quiz_params)

    if @quiz.save
      render json: @quiz, status: :created
    else
      render json: { errors: @quiz.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/quizzes/:id
  def update
    if @quiz.update(quiz_params)
      render json: @quiz
    else
      render json: { errors: @quiz.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/quizzes/:id
  def destroy
    @quiz.destroy
    head :no_content
  end

  private

  def set_quiz
    @quiz = Quiz.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Quiz not found' }, status: :not_found
  end

  def quiz_params
    params.require(:quiz).permit(:title)
  end
end
