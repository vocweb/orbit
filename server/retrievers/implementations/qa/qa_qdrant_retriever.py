# qa_qdrant_retriever.py
"""
QA-specialized Qdrant retriever using the base class
"""

import logging
import traceback
from typing import Dict, Any, List, Optional, Tuple
from fastapi import HTTPException

from .qa_vector_base import QAVectorRetrieverBase
from ...base.base_retriever import RetrieverFactory
from ...adapters.registry import ADAPTER_REGISTRY
from ..vector.qdrant_retriever import QdrantRetriever

logger = logging.getLogger(__name__)

class QAQdrantRetriever(QAVectorRetrieverBase, QdrantRetriever):
    """
    QA-specialized Qdrant retriever that extends QAVectorRetrieverBase.
    
    Inherits from both QAVectorRetrieverBase for QA functionality and
    QdrantRetriever for Qdrant-specific database operations.
    """
    
    def __init__(self, 
                 config: Dict[str, Any],
                 embeddings: Optional[Any] = None,
                 domain_adapter=None,
                 collection: Any = None,
                 **kwargs):
        """Initialize QA Qdrant retriever."""
        # Call QAVectorRetrieverBase constructor first
        QAVectorRetrieverBase.__init__(self, config, **kwargs)
        
        # Initialize QdrantRetriever with the same config and embeddings
        QdrantRetriever.__init__(self, config, embeddings, domain_adapter, **kwargs)
        
        # Store additional parameters for later use
        self._embeddings = embeddings
        self._domain_adapter = domain_adapter
        self._collection = collection
        
        # Qdrant-specific parameters
        self.score_threshold = self.adapter_config.get(
            'score_threshold', self.confidence_threshold
        ) if self.adapter_config else self.confidence_threshold
        
        self.score_scaling_factor = self.adapter_config.get(
            'score_scaling_factor', 1.0
        ) if self.adapter_config else 1.0
        
        logger.info(f"QAQdrantRetriever initialized with:")
        logger.info(f"  score_threshold={self.score_threshold}")
        logger.info(f"  score_scaling_factor={self.score_scaling_factor}")
    
    def get_datasource_name(self) -> str:
        """Return the datasource name."""
        return 'qdrant'
    
    async def initialize(self) -> None:
        """Initialize the QA Qdrant retriever."""
        # Initialize parent services (including embeddings)
        await super().initialize()
        
        # Initialize the Qdrant client
        await self.initialize_client()
        
        # Initialize domain adapter
        await self.initialize_domain_adapter()
        
        # Mark as initialized
        self.initialized = True
        
        if self.verbose:
            logger.info(f"QAQdrantRetriever initialized successfully")
    
    def convert_score_to_confidence(self, score: float) -> float:
        """
        Convert Qdrant similarity score to confidence value.
        
        Qdrant returns cosine similarity scores, typically in range [0, 1].
        Apply scaling factor if configured.
        """
        return score * self.score_scaling_factor
    
    async def query_vector_database(self, 
                                  query_embedding: List[float], 
                                  collection_name: str,
                                  max_results: int) -> Any:
        """Query Qdrant collection."""
        try:
            # Ensure client is initialized
            if not self.qdrant_client:
                logger.error("Qdrant client is not initialized")
                await self.initialize_client()
                
            if not self.qdrant_client:
                logger.error("Failed to initialize Qdrant client")
                return []
                
            return self.qdrant_client.search(
                collection_name=collection_name,
                query_vector=query_embedding,
                limit=max_results,
                with_payload=True
            )
        except Exception as e:
            logger.error(f"Error querying Qdrant: {str(e)}")
            logger.error(traceback.format_exc())
            return []
    
    def extract_document_data(self, result: Any) -> Tuple[str, Dict[str, Any], float]:
        """Extract document, metadata, and score from Qdrant result."""
        payload = result.payload or {}
        doc = (payload.get('content') or 
               payload.get('document') or 
               payload.get('text') or 
               '')
        score = float(result.score)
        return str(doc), payload, score
    
    def _iterate_results(self, results: Any):
        """Convert Qdrant results to iterable format."""
        # Qdrant returns a list of results directly
        return results
    
    def _get_result_count(self, results: Any) -> int:
        """Get the count of results from Qdrant format."""
        return len(results) if results else 0
    
    async def validate_collection(self) -> bool:
        """Validate that Qdrant collection is properly set."""
        # For Qdrant, we need to ensure both client and collection_name are set
        if not self.qdrant_client:
            try:
                await self.initialize_client()
            except Exception as e:
                logger.error(f"Failed to initialize Qdrant client during validation: {str(e)}")
                return False
        
        return bool(self.qdrant_client and self.collection_name)
    
    def _add_database_specific_metadata(self, context_item: Dict, result: Any, score: float):
        """Add Qdrant-specific metadata."""
        context_item["metadata"]["score"] = score
        context_item["metadata"]["score_scaling_factor"] = self.score_scaling_factor
        context_item["metadata"]["scaled_similarity"] = self.convert_score_to_confidence(score)
    
    async def set_collection(self, collection_name: str) -> None:
        """Set the current collection name for Qdrant."""
        if not collection_name:
            raise ValueError("Collection name cannot be empty")
        
        # Ensure client is initialized
        if not self.qdrant_client:
            await self.initialize_client()
        
        self.collection_name = collection_name
        
        if self.verbose:
            logger.info(f"[QAQdrantRetriever] Set collection name to: {collection_name}")
    
    def _create_fallback_adapter(self):
        """Create a fallback adapter specifically for Qdrant."""
        # For Qdrant, we might want to fall back to a generic QA adapter
        # that doesn't rely on Chroma-specific features
        return ADAPTER_REGISTRY.create(
            adapter_type='retriever',
            datasource='chroma',  # Still use chroma as fallback for now
            adapter_name='qa',
            config=self.config
        )

# Register the QA-specialized retriever with the factory
RetrieverFactory.register_retriever('qa_qdrant', QAQdrantRetriever)