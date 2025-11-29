class Api::V1::QuestionsController < ApplicationController
  before_action :set_quiz
  before_action :set_question, only: [:update, :destroy]

  # POST /api/v1/quizzes/:quiz_id/questions
  def create
    @question = @quiz.questions.build(question_params)

    if @question.save
      # Create options if provided
      if params[:options].present?
        params[:options].each do |option_params|
          @question.options.create(option_params.permit(:content, :correct))
        end
      end

      render json: @question, include: :options, status: :created
    else
      render json: { errors: @question.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/quizzes/:quiz_id/questions/:id
  def update
    if @question.update(question_params)
      # Update options if provided
      if params[:options].present?
        @question.options.destroy_all
        params[:options].each do |option_params|
          @question.options.create(option_params.permit(:content, :correct))
        end
      end

      render json: @question, include: :options
    else
      render json: { errors: @question.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/quizzes/:quiz_id/questions/:id
  def destroy
    @question.destroy
    head :no_content
  end

  private

  def set_quiz
    @quiz = Quiz.find(params[:quiz_id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Quiz not found' }, status: :not_found
  end

  def set_question
    @question = @quiz.questions.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Question not found' }, status: :not_found
  end

  def question_params
    params.require(:question).permit(:context, :qtype)
  end
end
