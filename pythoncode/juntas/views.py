from django.shortcuts import render
from rest_framework import generics, permissions
from rest_framework.response import Response
from capital.models import CapitalSocial
from .models import Junta
from .serializers import JuntaSerializer
from rest_framework.decorators import api_view
from users.models import CustomUser

class JuntaList(generics.ListCreateAPIView):
    queryset = Junta.objects.all()
    serializer_class = JuntaSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    # def perform_create(self, serializer):
    #     junta = serializer.save()
    #     CapitalSocial.objects.create(junta=junta)
    # def perform_create(self, serializer):
        # junta = serializer.save(members=[self.request.user])
        # Create a new CapitalSocial instance associated with the created Junta
        # CapitalSocial.objects.create(junta=junta)

class JuntaDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Junta.objects.all()
    serializer_class = JuntaSerializer
    permission_classes = [permissions.IsAuthenticated]

class JuntaDelete(generics.DestroyAPIView):
    queryset = Junta.objects.all()
    serializer_class = JuntaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        remaining_juntas = Junta.objects.all()
        serializer = self.get_serializer(remaining_juntas, many=True)
        return Response(serializer.data)


# @api_view(['POST'])
# def add_user_junta(request):
#     junta_id = request.data['junta_id']
#     user_id = request.data['user_id']
#     print(junta_id)
#     print(user_id)
#     try:
#         junta = Junta.objects.get(id=junta_id)
#         user = CustomUser.objects.get(id=user_id)
#         print(junta)
#         print(user)
#         junta.members.add(user)
#         junta.save()
#         serializer = JuntaSerializer(junta)
#         return Response(serializer.data)
#         # return Response()
#     except Junta.DoesNotExist:
#         return Response({"error": "Junta not found"}, status=404)
#     except CustomUser.DoesNotExist:
#         return Response({"error": "User not found"}, status=404)
#     except Exception as e:
#         return Response({"error": str(e)}, status=500)

@api_view(['POST'])
def add_user_junta(request):
    junta_id = request.data.get('junta_id')
    user_id = request.data.get('user_id')
    
    if not junta_id or not user_id:
        return Response({"error": "Both junta_id and user_id are required"}, status=400)
    
    try:
        junta = Junta.objects.get(id=junta_id)
        user = CustomUser.objects.get(id=user_id)
        junta.members.add(user)  # Add user to junta members
        junta.save()  # Save changes
        
        serializer = JuntaSerializer(junta)
        return Response(serializer.data)
    
    except Junta.DoesNotExist:
        return Response({"error": "Junta not found"}, status=404)
    
    except CustomUser.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    
    except Exception as e:
        return Response({"error": str(e)}, status=500)
