import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from '../../components/ui/Sidebar';
import { useStudyGroupDetail } from '../../hooks/useStudyGroups';
import { notesApi } from '../../api/notes';
import type { GroupMember, Note, CreateStudyGroupNotePayload } from '../../api/types';

const StudyGroupDetail = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useStudyGroupDetail(Number(groupId));
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [showCreateNote, setShowCreateNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [creatingNote, setCreatingNote] = useState(false);

  useEffect(() => {
    if (groupId) {
      fetchNotes();
    }
  }, [groupId]);

  const fetchNotes = async () => {
    if (!groupId) return;
    
    setNotesLoading(true);
    try {
      const response = await notesApi.getStudyGroupNotes(groupId);
      if (response.success && response.data) {
        setNotes(response.data.notes);
      }
    } catch (error) {
      console.error('Failed to fetch study group notes:', error);
    } finally {
      setNotesLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!groupId || !newNoteTitle.trim()) return;

    setCreatingNote(true);
    try {
      const payload: CreateStudyGroupNotePayload = {
        title: newNoteTitle.trim(),
        content: { type: 'doc', content: [] },
        visibilityScope: 'group',
      };

      await notesApi.createStudyGroupNote(groupId, payload);
      setNewNoteTitle('');
      setShowCreateNote(false);
      await fetchNotes(); // Refresh notes list
    } catch (error) {
      console.error('Failed to create note:', error);
    } finally {
      setCreatingNote(false);
    }
  };

  const handleOpenNote = (note: Note) => {
    // Navigate to the note editor with collaboration enabled
    navigate(`/notes/${note.noteId}?group=${groupId}&collaboration=true`);
  };

  const getVisibilityBadge = (_visibility: string) => 'bg-white/5 text-white/80 border-white/10';

  const getRoleBadge = (_role: string) => 'bg-white/5 text-white/80 border-white/10';

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  return (
    <div className="flex h-screen bg-[#1E1E1E] overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-white/20 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400">Loading study group...</p>
            </div>
          </div>
        )}

        {isError && (
          <div className="p-8">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
              <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-400 font-medium mb-1">Failed to load study group</p>
              <p className="text-gray-400 text-sm">
                {error?.response?.message || error?.message || 'Please try again later'}
              </p>
              <button
                onClick={() => navigate(-1)}
                className="mt-4 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        )}

        {!isLoading && !isError && data?.group && (
          <div className="p-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-[#242424] border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/10 border border-white/15 rounded-2xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold text-white mb-1">
                          {data.group.groupName}
                        </h1>
                        <p className="text-gray-400 text-sm">
                          Created by {data.group.createdBy.userName} • {formatDate(data.group.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className={`px-4 py-2 rounded-xl text-sm font-medium border ${getVisibilityBadge(data.group.visibility)}`}>
                      {data.group.visibility}
                    </span>
                  </div>

                  <p className="text-gray-300 mb-6">
                    {data.group.description}
                  </p>

                  {/* <div className="flex gap-3">
                    <button className="px-6 py-3 bg-gray-800 text-white font-medium rounded-xl hover:bg-gray-700 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </button>
                  </div> */}
                </div>

                {/* <div className="bg-[#242424] border border-gray-800 rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Meeting Schedule
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                      <p className="text-gray-400 text-sm mb-1">Meeting Day</p>
                      <p className="text-white font-medium">{data.group.settings.meetingDay}</p>
                    </div>
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                      <p className="text-gray-400 text-sm mb-1">Meeting Time</p>
                      <p className="text-white font-medium">{formatTime(data.group.settings.meetingTime)}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm">
                    {data.group.settings.allowRecording ? (
                      <>
                        <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-white/70">Recording allowed</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="text-red-400">Recording not allowed</span>
                      </>
                    )}
                  </div>
                </div> */}

                <div className="bg-[#242424] border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Group Notes
                    </h2>
                    <button
                      onClick={() => setShowCreateNote(true)}
                      className="px-4 py-2 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Create Note
                    </button>
                  </div>

                  {notesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-4 border-white/20 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-400">Loading notes...</p>
                      </div>
                    </div>
                  ) : notes.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-400 mb-2">No notes yet</p>
                      <p className="text-gray-500 text-sm">Create the first collaborative note for your study group</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notes.map((note) => (
                        <div
                          key={note.noteId}
                          onClick={() => handleOpenNote(note)}
                          className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-white/20 transition-colors cursor-pointer group"
                        >
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-medium truncate mb-1">{note.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span>Updated {formatDate(note.updatedAt)}</span>
                              {note.collaborationEnabled && (
                                <span className="flex items-center gap-1 text-green-400">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  Collaborative
                                </span>
                              )}
                            </div>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-[#242424] border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Members</h2>
                    <span className="px-3 py-1 bg-white/10 text-white/80 text-sm font-medium rounded-lg border border-white/15">
                      {data.group.members.length}
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {data.group.members.map((member: GroupMember) => (
                      <div
                        key={member.userId}
                        className="flex items-center gap-3 p-3 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-white/20 transition-colors"
                      >
                        <div className="w-10 h-10 bg-white/10 border border-white/15 rounded-full flex items-center justify-center text-white/80 font-bold text-sm shrink-0">
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.userName} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            getInitials(member.userName)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-medium truncate">{member.userName}</p>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getRoleBadge(member.role)}`}>
                              {member.role}
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs">
                            Joined {formatDate(member.joinedAt)}
                          </p>
                        </div>
                        {member.status === 'active' && (
                          <div className="w-2 h-2 bg-white/60 rounded-full shrink-0"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Note Modal */}
        {showCreateNote && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#242424] border border-gray-800 rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-white mb-4">Create New Note</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Note Title
                  </label>
                  <input
                    type="text"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="Enter note title..."
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-white/30 focus:outline-none transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !creatingNote) {
                        handleCreateNote();
                      }
                    }}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCreateNote(false)}
                    className="flex-1 px-4 py-3 bg-gray-800 text-gray-300 font-medium rounded-xl hover:bg-gray-700 transition-colors"
                    disabled={creatingNote}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateNote}
                    disabled={!newNoteTitle.trim() || creatingNote}
                    className="flex-1 px-4 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {creatingNote ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-transparent rounded-full animate-spin"></div>
                        Creating...
                      </>
                    ) : (
                      'Create Note'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudyGroupDetail;
