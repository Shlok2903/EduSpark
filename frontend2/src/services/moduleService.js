import api from './api';

/**
 * Module services for handling all module/content-related API interactions
 */
const moduleService = {
  // Get all modules for a section
  getModulesBySectionId: (sectionId) => 
    api.get(`/modules/sections/${sectionId}/modules`),
  
  // Get a specific module by ID
  getModuleById: (moduleId) => 
    api.get(`/modules/modules/${moduleId}`),
  
  // Create a new module
  createModule: async (courseId, sectionId, moduleData) => {
    try {
      // Format the module data to match the backend expectations
      const formattedData = {
        title: moduleData.title,
        description: moduleData.description || '',
        contentType: moduleData.contentType || moduleData.type
      };
      
      // Handle the quiz to quizz conversion
      if (formattedData.contentType === 'quiz') {
        formattedData.contentType = 'quizz';
      }
      
      // Format the content based on the content type
      switch (moduleData.contentType || moduleData.type) {
        case 'video':
          // Get the video URL from the most likely location
          const videoUrl = moduleData.videoUrl || 
                           moduleData.content?.url || 
                           moduleData.content?.videoUrl || 
                           '';
          
          if (!videoUrl) {
            console.error('Missing video URL in module data:', moduleData);
            throw new Error('Video URL is required for video content');
          }
          
          // Structure the video content as per the backend model expectation
          formattedData.videoContent = { videoUrl };
          break;
        case 'text':
          const textContent = moduleData.textContent || 
                             moduleData.content?.text || 
                             '';
                             
          if (!textContent) {
            console.error('Missing text content in module data:', moduleData);
            throw new Error('Text content is required for text type modules');
          }
          
          formattedData.textContent = textContent;
          break;
        case 'quiz':
          const quizQuestions = moduleData.quizQuestions || 
                               moduleData.content?.questions || 
                               [];
                               
          if (!quizQuestions || quizQuestions.length === 0) {
            console.error('Missing quiz questions in module data:', moduleData);
            throw new Error('Quiz questions are required for quiz type modules');
          }
          
          // Map the quiz questions to the expected format if needed
          formattedData.quizQuestions = quizQuestions.map ? quizQuestions.map(q => ({
            question: q.question,
            options: q.options.map((text, index) => ({
              text,
              isCorrect: index === q.correctOption
            }))
          })) : quizQuestions;
          
          break;
        default:
          console.error('Invalid content type:', moduleData.contentType || moduleData.type);
          throw new Error(`Invalid content type: ${moduleData.contentType || moduleData.type}`);
      }

      console.log('Sending to API:', formattedData);
      
      return api.post(`/modules/courses/${courseId}/sections/${sectionId}/modules`, formattedData);
    } catch (error) {
      console.error('Error creating module:', error);
      throw error;
    }
  },
  
  // Create multiple modules for a section (batch creation)
  createModulesBatch: async (courseId, sectionId, modulesData) => {
    try {
      // Format the modules data to match backend expectations
      const formattedModules = modulesData.map(moduleData => {
        const formattedData = {
          title: moduleData.title,
          description: moduleData.description || '',
          type: moduleData.type
        };
        
        // Format the content based on the content type
        switch (moduleData.type) {
          case 'video':
            // Get the video URL from the most likely location
            const videoUrl = moduleData.videoUrl || 
                             moduleData.content?.url || 
                             moduleData.content?.videoUrl || 
                             '';
            
            if (!videoUrl) {
              console.error('Missing video URL in module data:', moduleData);
              throw new Error('Video URL is required for video content');
            }
            
            // Structure the video content as per the backend model expectation
            formattedData.content = { 
              url: videoUrl,
              videoUrl: videoUrl // Include for backward compatibility
            };
            break;
          case 'text':
            const textContent = moduleData.textContent || 
                               moduleData.content?.text || 
                               '';
                               
            if (!textContent) {
              console.error('Missing text content in module data:', moduleData);
              throw new Error('Text content is required for text type modules');
            }
            
            formattedData.content = { text: textContent };
            break;
          case 'quiz':
            const quizQuestions = moduleData.quizQuestions || 
                                 moduleData.content?.questions || 
                                 [];
                                 
            if (!quizQuestions || quizQuestions.length === 0) {
              console.error('Missing quiz questions in module data:', moduleData);
              throw new Error('Quiz questions are required for quiz type modules');
            }
            
            // Map the quiz questions and options to match backend format
            formattedData.content = {
              questions: quizQuestions
            };
            break;
          default:
            console.error('Invalid content type:', moduleData.type);
            throw new Error(`Invalid content type: ${moduleData.type}`);
        }
        
        return formattedData;
      });

      console.log('Sending batch modules to API:', {
        modules: formattedModules,
        courseId,
        sectionId
      });
      
      // Send the request to create modules in batch
      return api.post('/modules/modules/batch', {
        modules: formattedModules,
        courseId,
        sectionId
      });
    } catch (error) {
      console.error('Error creating modules in batch:', error);
      throw error;
    }
  },
  
  // Update a module
  updateModule: (moduleId, moduleData) => 
    api.put(`/modules/modules/${moduleId}`, moduleData),
  
  // Delete a module
  deleteModule: (moduleId) => 
    api.delete(`/modules/modules/${moduleId}`),
  
  // Update the order of modules
  updateModulesOrder: (sectionId, modulesOrder) => 
    api.put(`/modules/sections/${sectionId}/modules/order`, { modulesOrder })
};

export default moduleService; 